import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { group } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function GET() {
  const session = await auth();
    if (!session?.user || session.user.type !== 'admin') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { jti, id: userId } = session.user;
    if (!jti) {
        return new ChatSDKError('invalidtoken:auth').toResponse();
    }

    const storedUserId = await redis.get(`jti:whitelist:${jti}`);
    if (storedUserId !== userId) {
        return new Response('Session revoked', { status: 419 });
    }

  const data = await db.select().from(group);
  return NextResponse.json(data);
}