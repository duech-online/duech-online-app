'use server';

import { redirect } from 'next/navigation';
import { createUser } from '@/app/lib/users';
import { setSessionCookie } from '@/app/lib/auth';

export async function register(_: unknown, formData: FormData): Promise<string | undefined> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  if (!name || !email || !password || password.length < 6) {
    return 'Please provide name, email, and a password of at least 6 characters';
  }

  try {
    // Create the user
    const newUser = await createUser(name, email, password);
    
    // Set session cookie
    await setSessionCookie({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });
    
    redirect(redirectTo);
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already registered') {
      return 'Email already registered';
    }
    return 'Failed to create account';
  }
}