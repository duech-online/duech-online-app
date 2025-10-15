import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createToken, verifyToken } from '@/app/lib/auth';

const EDITOR_HOST = 'editor.localhost';
const PUBLIC_ASSET_PATTERN = /\.(ico|png|jpg|jpeg|gif|svg|webp|js|css|txt|xml|map)$/i;
const SESSION_COOKIE = 'duech_session';
const EDITOR_ROLES = ['lexicographer', 'editor', 'admin', 'superadmin'];
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const DEV_AUTO_AUTH =
  process.env.NODE_ENV !== 'production' && process.env.DISABLE_DEV_AUTH !== 'true';

const DEV_USER = {
  id: process.env.DEV_SESSION_USER_ID || 'dev-user',
  email: process.env.DEV_SESSION_EMAIL || 'dev@example.com',
  name: process.env.DEV_SESSION_NAME || 'Dev User',
  role: process.env.DEV_SESSION_ROLE || 'admin',
};

function isBypassPath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_ASSET_PATTERN.test(pathname)
  );
}

async function checkEditorAuthentication(request: NextRequest): Promise<boolean> {
  if (DEV_AUTO_AUTH) {
    return true;
  }

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

async function ensureDevSessionCookie(request: NextRequest): Promise<string | null> {
  if (!DEV_AUTO_AUTH) {
    return null;
  }

  const existingToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (existingToken) {
    const payload = await verifyToken(existingToken);
    if (payload && (!payload.role || EDITOR_ROLES.includes(payload.role))) {
      return null;
    }
  }

  return createToken(DEV_USER, SESSION_MAX_AGE);
}

/**
 * Middleware for handling editor access and protecting editor routes.
 * Verifies user session/JWT token and checks user role.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const hostname = url.hostname;
  const devToken = await ensureDevSessionCookie(request);
  let response: NextResponse;

  if (hostname === EDITOR_HOST) {
    if (isBypassPath(pathname)) {
      response = NextResponse.next();
    } else {
      const isAuthenticated = await checkEditorAuthentication(request);
      if (!isAuthenticated) {
        const loginUrl = new URL('/editor', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        response = NextResponse.redirect(loginUrl);
      } else if (!pathname.startsWith('/editor')) {
        const rewriteUrl = new URL(request.url);
        rewriteUrl.pathname = pathname === '/' ? '/editor/buscar' : `/editor${pathname}`;
        response = NextResponse.rewrite(rewriteUrl);
      } else {
        response = NextResponse.next();
      }
    }
  } else if (pathname.startsWith('/editor') && !isBypassPath(pathname)) {
    const isAuthenticated = await checkEditorAuthentication(request);

    // If accessing login page (/editor) while authenticated, redirect to /editor/buscar
    if (pathname === '/editor' && isAuthenticated) {
      response = NextResponse.redirect(new URL('/editor/buscar', request.url));
    } else if (pathname !== '/editor' && !isAuthenticated) {
      // If accessing protected subroutes without auth, redirect to login
      const loginUrl = new URL('/editor', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  if (devToken) {
    response.cookies.set({
      name: SESSION_COOKIE,
      value: devToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: ['/(.*)'],
};
