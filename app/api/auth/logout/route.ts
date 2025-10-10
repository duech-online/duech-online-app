import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    await clearSessionCookie();
    const { searchParams } = new URL(request.url);
    const redirectTo = '/editor';

    // Always return JSON response for consistency
    const response = NextResponse.json({
      success: true,
      redirectTo: redirectTo,
    });

    // Ensure the cookie is cleared in the response as well
    response.cookies.delete('duech_session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Return JSON error response
    const response = NextResponse.json(
      {
        success: false,
        redirectTo: '/',
        error: 'Logout failed',
      },
      { status: 500 }
    );

    response.cookies.delete('duech_session');
    return response;
  }
}

// Also handle GET requests in case the form submission method gets confused
export async function GET(request: Request) {
  return POST(request);
}