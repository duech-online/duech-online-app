'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function HeaderAuth() {
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]); // Re-fetch whenever pathname changes
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Iniciar sesión
        </a>
        <a
          href={`/register?callbackUrl=${encodeURIComponent(pathname)}`}
          className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Registrarse
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/80">{user.name || user.email}</span>
      <form action={`/api/logout?redirect=${encodeURIComponent(pathname)}`} method="POST">
        <button
          type="submit"
          className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
