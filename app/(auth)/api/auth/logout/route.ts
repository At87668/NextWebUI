import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import redis from '@/lib/redis/redis';

export async function POST(req: NextRequest) {
  const authResult = await auth();

  if (!authResult?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authResult.user as { jti?: string; exp?: number };

  const { jti, exp } = token;
  if (!jti || !exp) {
    return new Response('Invalid token', { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const remainingSeconds = exp - now;

  if (remainingSeconds > 0) {
    await redis.setex(`jti:blacklist:${jti}`, remainingSeconds, '1');
  }

  return new Response('Logged out and token revoked', { status: 200 });
}
