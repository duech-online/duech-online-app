import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EDITOR_HOST = 'editor.localhost';
const PUBLIC_ASSET_PATTERN = /\.(ico|png|jpg|jpeg|gif|svg|webp|js|css|txt|xml|map)$/i;

function isBypassPath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_ASSET_PATTERN.test(pathname)
  );
}

/**
 * Middleware for handling editor access and protecting editor routes.
 *
 * TODO: Add authentication check here
 * - Check user role (editor, admin, superadmin)
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const hostname = url.hostname;

  if (hostname === EDITOR_HOST) {
    if (isBypassPath(pathname)) {
      return NextResponse.next();
    }

    if (!pathname.startsWith('/editor')) {
      const rewriteUrl = new URL(request.url);
      rewriteUrl.pathname = pathname === '/' ? '/editor/buscar' : `/editor${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  const userSession = request.cookies.get('duech_session')?.value;

  if (pathname === '/editor') {
    if (userSession) {
      const dashboardUrl = new URL('/editor/buscar', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/editor/')) {
    if (!userSession) {
      const loginUrl = new URL('/editor', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(.*)'],
};