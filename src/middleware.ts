import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EDITOR_HOST = 'editor.localhost';
const LOCALHOST = 'localhost';
const EDITOR_PATH_PREFIX = '/editor';
const SESSION_COOKIE = 'duech_session';

function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.startsWith('/api/') || // API routes
    pathname === '/login' || // Login page
    /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i.test(pathname) // Static files
  );
}

function isEditorPathAccess(hostname: string | undefined, pathname: string): boolean {
  if (hostname !== LOCALHOST) {
    return false;
  }

  return pathname === EDITOR_PATH_PREFIX || pathname.startsWith(`${EDITOR_PATH_PREFIX}/`);
}

function normalizeEditorPath(pathname: string): string {
  if (pathname === EDITOR_PATH_PREFIX || pathname === `${EDITOR_PATH_PREFIX}/`) {
    return '/';
  }

  if (pathname.startsWith(`${EDITOR_PATH_PREFIX}/`)) {
    const normalized = pathname.slice(EDITOR_PATH_PREFIX.length);
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  return pathname;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0];
  const originalPathname = request.nextUrl.pathname;
  const isEditorPath = isEditorPathAccess(hostname, originalPathname);
  const normalizedPathname = isEditorPath
    ? normalizeEditorPath(originalPathname)
    : originalPathname;
  const shouldRewrite = isEditorPath;
  const targetUrl = request.nextUrl.clone();
  const editorBasePathHeader = isEditorPath ? EDITOR_PATH_PREFIX : '';

  if (shouldRewrite) {
    targetUrl.pathname = normalizedPathname;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isEditorMode = hostname === EDITOR_HOST || isEditorPath;

  // Skip middleware for bypass paths
  if (shouldBypass(normalizedPathname)) {
    const response = shouldRewrite ? NextResponse.rewrite(targetUrl) : NextResponse.next();
    response.headers.set('x-editor-mode', isEditorMode ? 'true' : 'false');
    response.headers.set('x-editor-base-path', editorBasePathHeader);
    return response;
  }

  // Redirect to login if accessing editor host without token
  if (isEditorMode && !token) {
    const loginPath = isEditorPath ? `${EDITOR_PATH_PREFIX}/login` : '/login';
    const redirectTarget = isEditorPath ? originalPathname : normalizedPathname;
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirectTo', redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  const response = shouldRewrite ? NextResponse.rewrite(targetUrl) : NextResponse.next();
  response.headers.set('x-editor-mode', isEditorMode ? 'true' : 'false');
  response.headers.set('x-editor-base-path', editorBasePathHeader);
  return response;
}
