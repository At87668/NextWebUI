import { db } from '../db/queries';
import { eq } from 'drizzle-orm';
import { group } from '../db/schema';
import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number | null; // `null` means unlimited
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

  // Handle chat models
  const availableChatModelIds = Array.isArray(models) ? models : [];

  if (!availableChatModelIds.length) {
    console.warn(`No available models configured for user group ${userType}.`);
  }

  // admin has no message limit
  let maxMessagesPerDay: number | null = null; // null = unlimited

  if (userType === 'admin') {
    console.info('Admin user detected: granting unlimited messages.');
  } else {
    // For non-admins, use DB value or fallback to 100
    if (maxMessagePerDay && typeof maxMessagePerDay === 'number' && maxMessagePerDay > 0) {
      maxMessagesPerDay = maxMessagePerDay;
    } else {
      console.warn(
        `Invalid or missing max_message_per_day for ${userType}: ${maxMessagePerDay}. Using default 100.`
      );
      maxMessagesPerDay = 100;
    }
  }

  return {
    maxMessagesPerDay,
    availableChatModelIds,
  };
}