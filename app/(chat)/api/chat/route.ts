import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { getDynamicProvider } from '@/lib/ai/providers';
import { getEntitlementsByUserType } from '@/lib/ai/entitlements';
import { getPostRequestBodySchema } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import { getUserSystemPrompt } from '@/lib/db/user-system-prompt';
import redis from '@/lib/redis/redis';
import { z } from 'zod';

const FALLBACK_MODEL_IDS = ['gpt-3.5-turbo', 'gpt-4', 'claude-2'] as const;
const postRequestBodySchemaForTypeInference = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.literal('user'),
    parts: z.array(
      z.union([
        z.object({
          type: z.literal('text'),
          text: z.string().min(1).max(2000),
        }),
        z.object({
          type: z.literal('file'),
          mediaType: z.enum(['image/jpeg', 'image/png']),
          name: z.string().min(1).max(100),
          url: z.string().url(),
        }),
      ])
    ),
  }),
  selectedChatModel: z.enum(FALLBACK_MODEL_IDS),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchemaForTypeInference>;

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;
  let validationSchema: Awaited<ReturnType<typeof getPostRequestBodySchema>>;

  try {
    validationSchema = await getPostRequestBodySchema();
  } catch (error) {
    console.error('Failed to load model schema:', error);
    return new ChatSDKError('bad_request:database').toResponse();
  }

  try {
    const json = await request.json();
    
    requestBody = (await validationSchema).parse(json) as PostRequestBody;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('Request validation failed:', error.errors);
      return new ChatSDKError('bad_request:api').toResponse();
    }
    
    console.error('Unexpected error during validation:', error);
    return new ChatSDKError('default:api').toResponse();
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody as {
        id: string;
        message: ChatMessage;
        selectedChatModel: ChatModel['id'];
        selectedVisibilityType: VisibilityType;
      };
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const { jti, id: userId } = session.user;
    if (!jti) {
      return new ChatSDKError('invalidtoken:auth').toResponse();
    }

    const isGuest = session.user.type === 'guest';

    if (!isGuest) {
      const storedUserId = await redis.get(`jti:whitelist:${jti}`);
      if (storedUserId !== userId) {
        return new Response('Session revoked', { status: 419 });
      }
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    const entitlements = await getEntitlementsByUserType(userType);
    if (entitlements?.maxMessagesPerDay && messageCount > entitlements.maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    let maxtokens = 5000;
    try {
      const { db } = await import('@/lib/db/queries');
      const { models } = await import('@/lib/db/schema');
      const { eq } = await import('drizzle-orm');
      const modelRow = await db.select({ max_token: models.max_token })
        .from(models)
        .where(eq(models.id, selectedChatModel));
      if (modelRow?.[0]?.max_token) {
        maxtokens = modelRow[0].max_token;
      }
    } catch (e) {
      // ignore, fallback to default
    }

    let customSystemPrompt = '';
    if (session.user?.id) {
      customSystemPrompt = (await getUserSystemPrompt(session.user.id)) ?? '';
    }

    const sysPrompt = await systemPrompt({
      customSystemPrompt,
      selectedChatModel,
      requestHints,
    });

    const myProvider = await getDynamicProvider();

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: sysPrompt,
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          maxOutputTokens: maxtokens,
          experimental_activeTools: [
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
              ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
        return 'Oops, something went wrong!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    } else {
      console.error('Unexpected error in POST /api/chat:', error);
      return new ChatSDKError('bad_request:api').toResponse();
    }
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}