import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/app/lib/auth';

/**
 * POST /api/logout
 * Clears the session cookie and logs the user out
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get('redirect') || '/';

    // Clear the session cookie
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      redirectTo: redirect,
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
