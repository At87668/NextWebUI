import { db } from './queries';
import { user } from './schema';
import { eq } from 'drizzle-orm';

export async function getUserSystemPrompt(userId: string): Promise<string> {
  const result = await db
    .select({ systemPrompt: user.systemPrompt })
    .from(user)
    .where(eq(user.id, userId));
  return result[0]?.systemPrompt ?? '';
}

export async function setUserSystemPrompt(userId: string, prompt: string) {
  await db
    .update(user)
    .set({ systemPrompt: prompt })
    .where(eq(user.id, userId));
}
