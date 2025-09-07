import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get('duech_session')?.value;

  // Protected paths
  const protectedPaths = ['/palabra', '/search', '/busqueda-avanzada'];

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/palabra/:path*',
    '/search',
    '/busqueda-avanzada',
    '/api/words/:path*',
    '/api/search',
    '/api/search/advanced',
  ],
};
