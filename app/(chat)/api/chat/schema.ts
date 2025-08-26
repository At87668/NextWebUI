import { z } from 'zod';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(['user']),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.enum([
    'qwen1.5-7b-chat-awq',
    'qwen1.5-14b-chat-awq',
    'qwen1.5-1.8b-chat',
    'chat-model-guest',
    'gpt-oss-120b',
    'gpt-oss-20b',
    'deepseek-r1-32b',
    'qwen2.5-coder-32b-instruct',
    'grok-2-vision',
    'grok-2',
    'grok-3-mini-beta',
  ]),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
