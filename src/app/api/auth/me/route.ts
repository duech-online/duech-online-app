import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's session data
 */
export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error fetching session user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
