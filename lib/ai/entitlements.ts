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
    if (userType === 'admin') {
      console.info('No DB config found for admin, using default entitlements: unlimited messages and all models access.');
      return {
        maxMessagesPerDay: null,
        availableChatModelIds: [],
      };
    }

    console.error(`User group configuration not found for: ${userType}`);
    return null;
  }

  const { models, maxMessagePerDay } = result[0];

  const availableChatModelIds = userType === 'admin'
    ? []
    : (Array.isArray(models) ? models : []);

  if (!availableChatModelIds.length && userType !== 'admin') {
    console.warn(`No available models configured for user group ${userType}.`);
  }

  let maxMessagesPerDay: number | null = null;

  if (typeof maxMessagePerDay === 'number' && maxMessagePerDay > 0) {
    maxMessagesPerDay = maxMessagePerDay;
  } else {
    console.warn(
      `Invalid or missing max_message_per_day for ${userType}: ${maxMessagePerDay}. Using default 100.`
    );
    maxMessagesPerDay = 100;
  }

  return {
    maxMessagesPerDay,
    availableChatModelIds,
  };
}