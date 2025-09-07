import { NextResponse } from 'next/server';
import { getSessionUser } from '@/app/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get current user:', error);
    return NextResponse.json(null, { status: 500 });
  }
}
