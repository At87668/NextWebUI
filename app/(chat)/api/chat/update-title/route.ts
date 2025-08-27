import { updateChatTitleById } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
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

  const { chatId, title } = await request.json();
  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }
  try {
    await updateChatTitleById({ chatId, title });
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
