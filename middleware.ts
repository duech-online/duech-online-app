import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createToken, verifyToken } from '@/lib/auth';

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
  console.log('[Middleware] checkEditorAuthentication - DEV_AUTO_AUTH:', DEV_AUTO_AUTH);
  if (DEV_AUTO_AUTH) {
    console.log('[Middleware] Auto-auth enabled, returning true');
    return true;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  console.log('[Middleware] Token present:', !!token);

  if (!token) return false;

  const payload = await verifyToken(token);
  console.log('[Middleware] Token verified:', !!payload, 'role:', payload?.role);

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

  // Skip middleware for bypass paths (static files, API routes, etc.)
  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  const devToken = await ensureDevSessionCookie(request);
  let response: NextResponse;

  const isEditorHost = hostname === EDITOR_HOST;

  console.log('[Middleware]', {
    pathname,
    hostname,
    isEditorHost,
    expectedHost: EDITOR_HOST,
  });

  if (isEditorHost) {
    const isAuthenticated = await checkEditorAuthentication(request);
    console.log('[Middleware] Editor host detected, authenticated:', isAuthenticated);
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      // Create a new request with the custom header
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-editor-mode', 'true');

      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
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
