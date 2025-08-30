import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { models } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';
import { eq } from 'drizzle-orm';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string[] }> }) {
  const { id } = await params;
  const modelId = id.join('/');

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

  const body = await req.json();
  const updates = {
    name: body.name,
    id: body.id,
    description: body.description,
    default_prompt: body.default_prompt,
    max_token: body.max_token || null,
    type: body.type,
    api_base_url: body.api_base_url || null,
    api_key: body.type === 'ollama' ? null : (body.api_key || null),
    api_id: body.api_id,
  };

  try {
    const [updated] = await db
      .update(models)
      .set(updates)
      .where(eq(models.id, modelId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'admin.models.not_found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'admin.models.update.fail' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string[] }> }) {
  const { id } = await params;
  const modelId = id.join('/');

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

  try {
    const result = await db.delete(models).where(eq(models.id, modelId)).returning();
    if (result.length === 0) {
      return NextResponse.json({ error: 'admin.models.not_found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'admin.models.delete.fail' }, { status: 500 });
  }
}