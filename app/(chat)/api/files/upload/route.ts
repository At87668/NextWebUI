import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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
    // Update the file type based on the kind oupload.file_to_largeaccept
    .refine(
      (file) => ['image/jpeg', 'image/png'].includes(file.type),
      {
        message: 'upload.flie_type_error',
      },
    ),
});

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
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'upload.no_flie_uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'upload.failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'request.failed' }, { status: 500 });
  }
}
