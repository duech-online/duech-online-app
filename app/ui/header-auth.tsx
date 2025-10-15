'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/app/ui/button';

export default function HeaderAuth() {
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser, pathname]); // Re-fetch whenever pathname changes

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentPath = window.location.pathname;
      const logoutUrl = `/api/auth/logout?redirect=${encodeURIComponent(currentPath)}`;

      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.redirectTo) {
          window.location.href = data.redirectTo;
        } else {
          window.location.href = '/';
        }
      } else {
        // Fallback redirect
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect
      window.location.href = '/';
    }
  };
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/80">{user.name || user.email}</span>
      <form onSubmit={handleLogout}>
        <Button
          type="submit"
          className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
