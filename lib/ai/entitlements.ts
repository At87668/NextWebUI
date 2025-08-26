import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['model1'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 3000,
    availableChatModelIds: [
      'model1',
      'model2',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
