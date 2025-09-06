import { redirect } from 'next/navigation';
import { getSessionUser } from '@/app/lib/auth';

export default async function ProtectedSearchLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/search')}`);
  }
  return <>{children}</>;
}
