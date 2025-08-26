'use client';
import { signOut } from 'next-auth/react';

export async function safeSignOut(options: {
  redirectTo?: string | undefined;
  jti: string | undefined;
}) {
  try {
    const jti = options.jti;

    if (jti) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jti }),
      });
    }
  } catch (err) {
    console.warn('Failed to revoke token, proceeding to sign out anyway.', err);
  } finally {
    await signOut({ redirectTo: options?.redirectTo ?? '/' });
  }
}
