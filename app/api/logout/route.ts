import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    await clearSessionCookie();
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirect') || '/';

    // Create the redirect response
    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    // Ensure the cookie is cleared in the response as well
    response.cookies.delete('duech_session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, redirect to home page
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirect') || '/';
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.delete('duech_session');
    return response;
  }
}

// Also handle GET requests in case the form submission method gets confused
export async function GET(request: Request) {
  return POST(request);
}
