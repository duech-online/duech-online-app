import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { users } from '@/app/lib/schema';

export async function GET() {
  try {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
    }).from(users);

    return NextResponse.json({
      success: true,
      data: allUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
