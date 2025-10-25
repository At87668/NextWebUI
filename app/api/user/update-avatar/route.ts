import { put, getDownloadUrl } from '@vercel/blob';
import { z } from 'zod';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import redis from '@/lib/redis/redis';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
	file: z
		.instanceof(Blob)
		.refine((file) => file.size <= 1 * 1024 * 1024, {
			message: 'upload.file_to_large',
		})
		.refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
			message: 'upload.flie_type_error',
		}),
});

function getExtFromMime(mime?: string) {
	if (!mime) return 'jpg';
	if (mime === 'image/png') return 'png';
	return 'jpg';
}

export async function POST(request: Request) {
	const session = await auth();

	if (!session) {
		return new ChatSDKError('unauthorized:auth').toResponse();
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

	if (request.body === null) {
		return new Response('Request is empty', { status: 400 });
	}

	try {
		// 支持 multipart/form-data 上传 file，也支持 JSON body 里发送 base64 的 data url
		const contentType = request.headers.get('content-type') || '';

		let pathname = '';
		let fileBuffer: ArrayBuffer | Uint8Array | Buffer | null = null;
		let contentTypeToUse: string | undefined = undefined;

		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const file = formData.get('file') as Blob | null;

			if (!file) {
				return NextResponse.json({ error: 'upload.no_flie_uploaded' }, { status: 400 });
			}

			const validated = FileSchema.safeParse({ file });
			if (!validated.success) {
				const errorMessage = validated.error.errors.map((e) => e.message).join(', ');
				return NextResponse.json({ error: errorMessage }, { status: 400 });
			}

			const filename = ((formData.get('file') as File)?.name) || `${userId}-${Date.now()}`;
			const ext = getExtFromMime(file.type);
			pathname = `avatars/${filename}`;
			fileBuffer = await file.arrayBuffer();
			contentTypeToUse = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg');
		} else {
			// assume JSON with { avatar: 'data:image/..;base64,...' }
			const body = await request.json().catch(() => ({}));
			const avatar = typeof body === 'object' ? (body.avatar as string | undefined) : undefined;

			if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
				return NextResponse.json({ error: 'upload.no_flie_uploaded' }, { status: 400 });
			}

			const match = avatar.match(/^data:(image\/jpeg|image\/png);base64,(.*)$/);
			if (!match) {
				return NextResponse.json({ error: 'upload.flie_type_error' }, { status: 400 });
			}

			const mime = match[1];
			const b64 = match[2];
			const buffer = Buffer.from(b64, 'base64');
			const ext = getExtFromMime(mime);
			pathname = `avatars/${userId}-${Date.now()}.${ext}`;
			fileBuffer = buffer;
			contentTypeToUse = mime;
			if (buffer.length > 1 * 1024 * 1024) {
				return NextResponse.json({ error: 'upload.file_to_large' }, { status: 400 });
			}
		}

		if (!fileBuffer) {
			return NextResponse.json({ error: 'upload.no_flie_uploaded' }, { status: 400 });
		}

		try {
			const data = await put(pathname, fileBuffer as any, {
				access: 'public',
				contentType: contentTypeToUse,
			});

			const publicUrl = (data as any).downloadUrl || getDownloadUrl((data as any).url);

			// 更新数据库中的 avatar 字段
			try {
				await db.update(user).set({ avatar: publicUrl }).where(eq(user.id, userId));
			} catch (dbErr) {
				// 如果更新 DB 失败，仍返回上传结果，但记录错误
				console.error('Failed to update user avatar in DB:', dbErr);
			}

			return NextResponse.json({ avatar: publicUrl, ...data });
		} catch (error) {
			return NextResponse.json({ error: 'upload.failed' }, { status: 500 });
		}
	} catch (error) {
		return NextResponse.json({ error: 'request.failed' }, { status: 500 });
	}
}

