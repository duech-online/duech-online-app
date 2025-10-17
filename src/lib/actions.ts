'use server';

import { redirect } from 'next/navigation';
import { setSessionCookie, type SessionUser } from '@/lib/auth';
import { getUserByEmail, getUserByUsername, verifyUserPassword } from '@/lib/queries';

// Demo user for backwards compatibility - checks against DB first
const DEMO_USER: SessionUser = {
  id: '1',
  email: process.env.DEMO_USER_EMAIL || 'admin@example.com',
  name: 'Admin',
  role: 'admin',
};
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'admin123';

export async function authenticate(_: unknown, formData: FormData): Promise<string | undefined> {
  const emailOrUsername = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  // Try database users first - check both email and username
  let dbUser = await getUserByEmail(emailOrUsername);
  if (!dbUser) {
    dbUser = await getUserByUsername(emailOrUsername);
  }

  if (dbUser && (await verifyUserPassword(dbUser.passwordHash, password))) {
    await setSessionCookie({
      id: String(dbUser.id),
      email: dbUser.email || dbUser.username,
      name: dbUser.username,
      role: dbUser.role,
    });

    redirect(redirectTo);
  }

  // Fallback demo user (for backwards compatibility)
  if (emailOrUsername === DEMO_USER.email.toLowerCase() && password === DEMO_PASSWORD) {
    await setSessionCookie(DEMO_USER);
    redirect(redirectTo);
  }

  return 'Invalid email or password';
}
