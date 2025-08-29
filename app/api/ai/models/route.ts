import { auth } from '@/app/(auth)/auth';
import { getEntitlementsByUserType } from '@/lib/ai/entitlements';
import { getChatModelsFromDB } from '@/lib/ai/models';
import { NextResponse } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  const { jti, id: userId, type: userType } = session.user;

  if (!jti) {
    return new ChatSDKError('invalidtoken:auth').toResponse();
  }

  const isGuest = userType === 'guest';

  if (!isGuest) {
    const storedUserId = await redis.get(`jti:whitelist:${jti}`);
    if (storedUserId !== userId) {
      return new Response('Session revoked', { status: 419 });
    }
  }

  try {
    const entitlements = await getEntitlementsByUserType(userType);
    if (!entitlements) {
      return NextResponse.json(
        { error: 'No entitlements found for user type' },
        { status: 404 }
      );
    }

    const allModels = await getChatModelsFromDB();

    const availableModels = userType === 'admin'
      ? allModels
      : allModels.filter((model) =>
          entitlements.availableChatModelIds.includes(model.id)
        );

    return NextResponse.json(availableModels);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}