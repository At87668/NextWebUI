import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function POST(req: Request) {
  const { nick } = await req.json();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  const { jti } = session.user;
  if (!jti) {
    return new ChatSDKError('invalidtoken:auth').toResponse();
  }

  const isGuest = session.user.type === 'guest';

  // 对非 guest 检查白名单
  if (!isGuest) {
    const storedUserId = await redis.get(`jti:whitelist:${jti}`);
    if (storedUserId !== userId) {
      return new Response('Session revoked', { status: 419 });
    }
  }

  if (!nick || typeof nick !== 'string' || nick.length > 32) {
    return NextResponse.json(
      { error: 'nick.incompliance' },
      { status: 400 },
    );
  }
  try {
    await db.update(user).set({ nick }).where(eq(user.id, userId));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'nick.update.fail', detail: String(err) },
      { status: 500 },
    );
  }
}
