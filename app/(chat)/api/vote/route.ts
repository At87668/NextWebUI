import { auth } from '@/app/(auth)/auth';
import { getChatById, getVotesByChatId, voteMessage } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api', 'Missing parameter: chatId').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:vote').toResponse();
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

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:vote').toResponse();
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new ChatSDKError(
      'bad_request:api',
      'Require parameters: chatId, messageId, type',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:vote').toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError('not_found:vote').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:vote').toResponse();
  }

  await voteMessage({
    chatId,
    messageId,
    type: type,
  });

  return new Response('Message voted', { status: 200 });
}
