"use server";

import { redirect } from 'next/navigation';
import { setSessionCookie, clearSessionCookie, type SessionUser } from '@/app/lib/auth';
import { createUser, findUserByEmail, verifyPassword } from '@/app/lib/users';

// Simple in-memory user for demo; replace with DB lookup
const DEMO_USER: SessionUser = {
  id: '1',
  email: process.env.DEMO_USER_EMAIL || 'admin@example.com',
  name: 'Admin',
};
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'admin123';

export async function authenticate(_: unknown, formData: FormData): Promise<string | undefined> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  // Try stored users first
  const stored = await findUserByEmail(email);
  if (stored && (await verifyPassword(stored, password))) {
    await setSessionCookie({ id: stored.id, email: stored.email, name: stored.name });
    redirect(redirectTo);
  }

  // Fallback demo user
  if (email === DEMO_USER.email.toLowerCase() && password === DEMO_PASSWORD) {
    await setSessionCookie(DEMO_USER);
    redirect(redirectTo);
  }

  return 'Invalid email or password';
}

export async function logout() {
  await clearSessionCookie();
  redirect('/');
}

export async function register(_: unknown, formData: FormData): Promise<string | undefined> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  if (!name || !email || !password || password.length < 6) {
    return 'Please provide name, email, and a password of at least 6 characters';
  }

  const user = await createUser(name, email, password);
  await setSessionCookie({ id: user.id, email: user.email, name: user.name });
  redirect(redirectTo);
}
