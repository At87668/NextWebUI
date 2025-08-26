import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getUserSystemPrompt,
  setUserSystemPrompt,
} from '@/lib/db/user-system-prompt';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new ChatSDKError('unauthorized:auth').toResponse();
  const { jti, id: userId } = session.user;
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
  const prompt = await getUserSystemPrompt(session.user.id);
  return NextResponse.json({ systemPrompt: prompt });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new ChatSDKError('unauthorized:auth').toResponse();

  const { jti, id: userId } = session.user;
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

  const { systemPrompt } = await req.json();
  await setUserSystemPrompt(session.user.id, systemPrompt);
  return NextResponse.json({ ok: true });
}
