import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EDITOR_HOST = process.env.HOST_URL || 'editor.localhost';
const SESSION_COOKIE = 'duech_session';

function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.startsWith('/api/') || // API routes
    pathname === '/login' || // Login page
    /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i.test(pathname) // Static files
  );
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0];
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isEditorMode = hostname === EDITOR_HOST;

  // Skip middleware for bypass paths
  if (shouldBypass(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-editor-mode', isEditorMode ? 'true' : 'false');
    return response;
  }

  // Redirect to login if accessing editor host without token
  if (isEditorMode && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('x-editor-mode', isEditorMode ? 'true' : 'false');
  return response;
}
