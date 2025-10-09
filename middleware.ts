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
 * - Verify user session/JWT token
 * - Check user role (editor, admin, superadmin)
 * - Redirect to login if not authenticated
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const hostname = url.hostname;

  // Requests coming from editor.localhost should be routed through /editor/…
  if (hostname === EDITOR_HOST) {
    if (isBypassPath(pathname)) {
      return NextResponse.next();
    }

    if (!pathname.startsWith('/editor')) {
      const rewriteUrl = new URL(request.url);
      rewriteUrl.pathname = pathname === '/' ? '/editor/buscar' : `/editor${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    // TODO: Authentication/authorization check for editor routes when implemented
    return NextResponse.next();
  }

  // Protect editor routes for all other hosts (e.g., localhost:3000/editor)
  if (pathname.startsWith('/editor') && !isBypassPath(pathname)) {
    // TODO: Add authentication check
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: ['/(.*)'],
};
