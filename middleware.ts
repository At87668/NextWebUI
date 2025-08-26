import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

const AUTH_REQUIRED_PATHS = [
    '/api/user',
    '/api/auth/logout'
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/ping')) {
        return new Response('pong', { status: 200 });
    }

    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    let token: any = undefined;
    try {
        token = await getToken({
            req: request,
            secret: process.env.AUTH_SECRET,
            secureCookie: !isDevelopmentEnvironment,
        });
    } catch (err) {
        console.error('getToken error:', err);
    }

    if (!token) {
        const redirectUrl = encodeURIComponent(request.url);
        return NextResponse.redirect(
            new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
        );
    }

    const isGuest = guestRegex.test(token?.email ?? '');

    if (token && !isGuest && ['/login', '/register', '/forgetpass'].includes(pathname)) {
        return NextResponse.rewrite(new URL('/auth-refresh.html', request.url));
    }

    const isProtectedPath = AUTH_REQUIRED_PATHS.some(path =>
        pathname === path || new RegExp(path.replace(':id', '[^/]+')).test(pathname)
    );

    if (isGuest && isProtectedPath) {
        return new NextResponse('No access to the path.', { status: 403 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/chat/:id',
        '/api/:path*',
        '/login',
        '/register',
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};