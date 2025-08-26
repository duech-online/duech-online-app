import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith('/api');
  const isLogin = pathname.startsWith('/login');
  const isRegister = pathname.startsWith('/register');

  // Public paths we allow
  const publicPaths = [
    '/',
    '/acerca',
    '/recursos',
    '/favicon.ico',
  ];

  const isPublic = publicPaths.includes(pathname) || isLogin || isRegister;

  // Only protect defined matchers below; for additional safety check cookie for all non-public matchers here
  const session = req.cookies.get('duech_session')?.value;
  const unauthenticated = !session;

  if (unauthenticated && !isPublic) {
    if (isApi) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `callbackUrl=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/palabra/:path*',
    '/search',
    '/api/words/:path*',
    '/api/search',
    '/api/search/advanced',
  ],
};
