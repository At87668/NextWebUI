
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';
import path from 'node:path';
import fs from 'node:fs/promises';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { avatar } = body;

    if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid avatar format' }, { status: 400 });
    }

    const maxSize = 100 * 1024; // 100KB
    const base64Size = avatar.length * 0.75;
    if (base64Size > maxSize) {
      return NextResponse.json({ error: 'Avatar too large (max 100KB)' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id)
      return new ChatSDKError('unauthorized:auth').toResponse();
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

    const matches = avatar.match(/^data:image\/(jpeg|png|jpg);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `${userId}_${Date.now()}.${ext}`;
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    const filePath = path.join(avatarsDir, fileName);
    const urlPath = `/avatars/${fileName}`;

    await fs.mkdir(avatarsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    await db
      .update(user)
      .set({ avatar: urlPath })
      .where(eq(user.id, userId));

    return NextResponse.json({ avatar: urlPath });
  } catch (error) {
    console.error('[UPDATE AVATAR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}