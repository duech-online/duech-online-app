import { getSessionUser } from '@/app/lib/auth';

export async function currentUser() {
  return getSessionUser();
}
