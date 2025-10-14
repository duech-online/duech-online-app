'use server';

import { redirect } from 'next/navigation';
import { setSessionCookie, type SessionUser } from '@/app/lib/auth';
import {
  getUserByEmail,
  getUserByUsername,
  verifyUserPassword,
  createDatabaseUser,
} from '@/app/lib/queries';

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
    console.log('[Auth] Setting session for user:', dbUser.username, 'role:', dbUser.role);
    await setSessionCookie({
      id: String(dbUser.id),
      email: dbUser.email || dbUser.username,
      name: dbUser.username,
      role: dbUser.role,
    });
    console.log('[Auth] Session cookie set, redirecting to:', redirectTo);
    redirect(redirectTo);
  }

  // Fallback demo user (for backwards compatibility)
  if (emailOrUsername === DEMO_USER.email.toLowerCase() && password === DEMO_PASSWORD) {
    await setSessionCookie(DEMO_USER);
    redirect(redirectTo);
  }

  return 'Invalid email or password';
}

export async function register(_: unknown, formData: FormData): Promise<string | undefined> {
  const username = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  if (!username || !password || password.length < 6) {
    return 'Please provide username and a password of at least 6 characters';
  }

  if (!email) {
    return 'Please provide an email address';
  }

  try {
    // Create the user in database
    const newUser = await createDatabaseUser(username, email, password, 'lexicographer');

    // Set session cookie
    await setSessionCookie({
      id: String(newUser.id),
      email: newUser.email || newUser.username,
      name: newUser.username,
      role: newUser.role,
    });

    redirect(redirectTo);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already exists') {
        return 'Email already registered';
      }
      if (error.message === 'Username already exists') {
        return 'Username already taken';
      }
    }
    return 'Failed to create account';
  }
}