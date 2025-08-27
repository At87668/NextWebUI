
import { db } from '../db/queries';
import { eq } from 'drizzle-orm';
import { group } from '../db/schema';
import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

const maxMessagesMap: Record<UserType, number> = {
  guest: 100,
  regular: 3000,
};

/**
 * Dynamically fetch available models based on user type.
 */
export async function getEntitlementsByUserType(userType: UserType): Promise<Entitlements | null> {
  const maxMessagesPerDay = maxMessagesMap[userType] ?? 100;
  const result = await db.select({ models: group.models }).from(group).where(eq(group.group, userType));
  if (!result.length) return null;
  return {
    maxMessagesPerDay,
    availableChatModelIds: result[0].models,
  };
}
