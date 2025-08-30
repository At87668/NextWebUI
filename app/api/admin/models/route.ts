import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { models } from '@/lib/db/schema';
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

    const data = await db.select().from(models);
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
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

    const {
        id,
        api_id,
        name,
        description,
        default_prompt,
        max_token,
        type,
        api_base_url,
        api_key,
    } = body;

    if (!id || !name) {
        return NextResponse.json({ error: 'admin.models.missing_parameter' }, { status: 400 });
    }

    try {
        const [model] = await db
            .insert(models)
            .values({
                id,
                api_id,
                name,
                description: description,
                default_prompt,
                max_token: max_token || null,
                type,
                api_base_url: api_base_url || null,
                api_key: api_key || null,
            })
            .onConflictDoUpdate({
                target: models.id,
                set: {
                    name,
                    description: description,
                    default_prompt,
                    max_token,
                    type,
                    api_base_url,
                    api_key,
                },
            })
            .returning();

        return NextResponse.json(model);
    } catch (error) {
        console.error('Model insert error:', error);
        return NextResponse.json({ error: 'errors.database_query_error' }, { status: 500 });
    }
}