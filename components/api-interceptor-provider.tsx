'use client';
import { useEffect } from 'react';
import { safeSignOut } from '@/app/(auth)/utils/safe-logout';
import { useSession } from 'next-auth/react';

export function ApiInterceptorProvider({
  children,
}: { children: React.ReactNode }) {
  const { data: session } = useSession();
  useEffect(() => {
    const originalFetch = window.fetch;

    let isSignOutInProgress = false;
    const PENDING_REQUESTS: Array<() => void> = [];

    async function handleUnauthorized() {
      if (isSignOutInProgress) {
        return new Promise<void>((resolve) => {
          PENDING_REQUESTS.push(resolve);
        });
      }

      isSignOutInProgress = true;
      try {
        PENDING_REQUESTS.forEach((resolve) => resolve());
        PENDING_REQUESTS.length = 0;

        safeSignOut({ redirectTo: '/', jti: session?.user.jti });
      } catch (error) {
        console.error('Sign out failed:', error);
      } finally {
        isSignOutInProgress = false;
      }
    }

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        if (response.status === 419) {
          await handleUnauthorized();
          return new Response('', { status: 419 }) as Response;
        }

        return response;
      } catch (error) {
        console.error('Fetch error:', error);

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          const url =
            args[0] instanceof Request ? args[0].url : String(args[0]);
          if (url.includes('/api/auth/session')) {
            console.warn('Network error on session check.');
          }
        }

        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
