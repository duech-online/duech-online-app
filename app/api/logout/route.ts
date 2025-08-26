import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/app/lib/auth';

export async function POST(request: Request) {
  await clearSessionCookie();
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') || '/';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
