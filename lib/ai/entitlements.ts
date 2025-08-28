import { db } from '../db/queries';
import { eq } from 'drizzle-orm';
import { group } from '../db/schema';
import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export async function getEntitlementsByUserType(userType: UserType): Promise<Entitlements | null> {
  const result = await db
    .select({
      models: group.models,
      maxMessagePerDay: group.max_message_per_day,
    })
    .from(group)
    .where(eq(group.group, userType))
    .limit(1);

  if (result.length === 0) {
    console.error(`User group configuration not found for: ${userType}`);
    return null;
  }

  const { models, maxMessagePerDay } = result[0];
  
  if (maxMessagePerDay === null || maxMessagePerDay <= 0) {
    console.warn(
      `Invalid max_message_per_day value for user group ${userType}: ${maxMessagePerDay}. Using default 100.`
    );
  }
  
  const maxMessages = maxMessagePerDay && maxMessagePerDay > 0 
    ? maxMessagePerDay 
    : 100;

  if (!Array.isArray(models) || models.length === 0) {
    console.warn(`No available models configured for user group ${userType}.`);
  }

  return {
    maxMessagesPerDay: maxMessages,
    availableChatModelIds: Array.isArray(models) ? models : [],
  };
}