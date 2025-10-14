import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/app/lib/auth';

const EDITOR_HOST = 'editor.localhost';
const PUBLIC_ASSET_PATTERN = /\.(ico|png|jpg|jpeg|gif|svg|webp|js|css|txt|xml|map)$/i;
const SESSION_COOKIE = 'duech_session';
const EDITOR_ROLES = ['lexicographer', 'editor', 'admin', 'superadmin'];

function isBypassPath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_ASSET_PATTERN.test(pathname)
  );
}

async function checkEditorAuthentication(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  console.log('[Middleware] Token present:', !!token);

  if (!token) return false;

  const payload = await verifyToken(token);
  console.log('[Middleware] Token valid:', !!payload, 'Role:', payload?.role);

  if (!payload) return false;

  // Check if user has editor role
  const hasRole = payload.role ? EDITOR_ROLES.includes(payload.role) : false;
  console.log('[Middleware] Has editor role:', hasRole);

  return hasRole;
}

/**
 * Middleware for handling editor access and protecting editor routes.
 * Verifies user session/JWT token and checks user role.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const hostname = url.hostname;

  if (hostname === EDITOR_HOST) {
    if (isBypassPath(pathname)) {
      return NextResponse.next();
    }

    // Check authentication for editor subdomain
    const isAuthenticated = await checkEditorAuthentication(request);
    if (!isAuthenticated) {
      const loginUrl = new URL('/editor', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!pathname.startsWith('/editor')) {
      const rewriteUrl = new URL(request.url);
      rewriteUrl.pathname = pathname === '/' ? '/editor/buscar' : `/editor${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  const userSession = request.cookies.get('duech_session')?.value;

    return NextResponse.next();
  }

  // Protect editor routes for all other hosts (e.g., localhost:3000/editor)
  if (pathname.startsWith('/editor') && !isBypassPath(pathname)) {
    const isAuthenticated = await checkEditorAuthentication(request);

    // If accessing login page (/editor) while authenticated, redirect to /editor/buscar
    if (pathname === '/editor' && isAuthenticated) {
      return NextResponse.redirect(new URL('/editor/buscar', request.url));
    }

    // If accessing protected subroutes without auth, redirect to login
    if (pathname !== '/editor' && !isAuthenticated) {
      const loginUrl = new URL('/editor', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(.*)'],
};