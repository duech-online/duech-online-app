import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EDITOR_HOST = 'editor.localhost';
const SESSION_COOKIE = 'duech_session';

function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||     // Next.js internals
    pathname.startsWith('/api/') ||       // API routes
    pathname === '/login' ||              // Login page
    /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i.test(pathname) // Static files
  );
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0];
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Skip middleware for bypass paths
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  // Redirect to login if accessing editor host without token
  if (hostname === EDITOR_HOST && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}