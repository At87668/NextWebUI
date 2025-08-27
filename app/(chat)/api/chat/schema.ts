import { z } from 'zod';
import { db } from '@/lib/db/queries';
import { models as modelsTable } from '@/lib/db/schema';

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

export async function getPostRequestBodySchema() {
  const modelRows = await db.select({ id: modelsTable.id }).from(modelsTable);
  const modelIds = modelRows.map(row => row.id);
  return z.object({
    id: z.string().uuid(),
    message: z.object({
      id: z.string().uuid(),
      role: z.enum(['user']),
      parts: z.array(partSchema),
    }),
    selectedChatModel: z.enum(modelIds as [string, ...string[]]),
    selectedVisibilityType: z.enum(['public', 'private']),
  });
}
