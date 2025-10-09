import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for protecting editor routes
 *
 * TODO: Add authentication check here
 * - Verify user session/JWT token
 * - Check user role (editor, admin, superadmin)
 * - Redirect to login if not authenticated
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect editor routes
  if (pathname.startsWith('/editor')) {
    // TODO: Add authentication check
    // For now, allow all requests (development mode)
    // Example of what should be added:
    // const session = await getSession(request);
    // if (!session) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
    // if (!['editor', 'admin', 'superadmin'].includes(session.user.role)) {
    //   return NextResponse.redirect(new URL('/', request.url));
    // }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: ['/editor/:path*'],
};
