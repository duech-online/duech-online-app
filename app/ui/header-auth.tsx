'use client';
import { useEffect, useState } from 'react';

export default function HeaderAuth() {
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
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
      <form action={`/api/logout?redirect=${encodeURIComponent(pathname)}`} method="post">
        <button className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
