import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { group } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;

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
    const groupName = decodeURIComponent(name);

    const updateData: any = {};
    if ('models' in body) updateData.models = body.models;
    if ('max_message_per_day' in body) updateData.max_message_per_day = body.max_message_per_day;
    if ('default_model' in body) updateData.default_model = body.default_model;

    try {
        const [updated] = await db
            .update(group)
            .set(updateData)
            .where(eq(group.group, groupName))
            .returning();

        if (!updated) return NextResponse.json({ error: 'admin.group.not_found' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'admin.group.update.fail' }, { status: 500 });
    }
}