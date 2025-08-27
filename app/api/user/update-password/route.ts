import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUser, updateUser } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function POST(req: Request) {
  const url = new URL(req.url);
  // 修改密码
  if (url.pathname.endsWith('/update-password')) {
    const { oldPassword, newPassword } = await req.json();
    const session = await auth();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId || !userEmail) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const { jti } = session.user;
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

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
    }

    const [user] = await getUser(session.user.email ?? '');
    if (!user) {
      return NextResponse.json({ error: 'The user does not exist.' }, { status: 404 });
    }

    const bcrypt = await import('bcrypt-ts');
    const match = await bcrypt.compare(oldPassword, user.password ?? '');
    if (!match) {
      return NextResponse.json({ error: 'password.update.original_password_wrong' }, { status: 400 });
    }
    if (newPassword === oldPassword) {
      return NextResponse.json({ error: 'password.update.same_password' }, { status: 400 });
    }

    await updateUser(userEmail, newPassword);

    const userJtiSetKey = `user:jti:set:${userId}`;
    const jtiList: string[] = await redis.smembers(userJtiSetKey);

    if (jtiList.length > 0) {

      const pipeline = redis.pipeline();
      for (const jti of jtiList) {
        pipeline.del(`jti:whitelist:${jti}`);
      }

      pipeline.del(userJtiSetKey);
      await pipeline.exec();

      //console.log(`Revoked ${jtiList.length} active sessions for user ${userId} after password reset`);
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown request' }, { status: 404 });
}
