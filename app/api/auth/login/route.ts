import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, type SessionUser } from '@/app/lib/auth';
import { findUserByEmail, verifyPassword } from '@/app/lib/users';

// Demo user for fallback
const DEMO_USER: SessionUser = {
  id: '1',
  email: process.env.DEMO_USER_EMAIL || 'admin@example.com',
  name: 'Admin',
};
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'admin123';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Try stored users first
    const stored = await findUserByEmail(email);
    if (stored && (await verifyPassword(stored, password))) {
      await setSessionCookie({
        id: stored.id,
        email: stored.email,
        name: stored.name,
      });

      return NextResponse.json({
        id: stored.id,
        email: stored.email,
        name: stored.name,
      });
    }

    // Fallback demo user
    if (email.toLowerCase() === DEMO_USER.email.toLowerCase() && password === DEMO_PASSWORD) {
      await setSessionCookie(DEMO_USER);
      return NextResponse.json(DEMO_USER);
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
