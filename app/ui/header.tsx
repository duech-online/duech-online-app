'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/app/ui/button';
import { isEditorModeClient } from '@/app/lib/editor-mode';

export default function Header() {
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const pathname = usePathname();
  const editorMode = isEditorModeClient(pathname);

  const homeLink = editorMode ? '/editor' : '/';
  const title = editorMode ? 'DUECh Editor' : 'DUECh';
  const subtitle = editorMode
    ? 'Editor del Diccionario del uso del español de Chile'
    : 'Diccionario del uso del español de Chile';

  const fetchUser = useCallback(async () => {
    if (!editorMode) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [editorMode]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser, pathname]);

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
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-duech-blue shadow-lg">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link
              href={homeLink}
              className="hover:text-duech-gold flex items-center gap-4 text-2xl font-bold text-white transition-colors"
            >
              <Image
                src="/logo_medium.png"
                alt="DUECh Logo"
                width={50}
                height={50}
                className="object-contain"
              />
              <div>
                <div className="text-duech-gold">{title}</div>
                <div className="text-xs font-normal text-gray-200">{subtitle}</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <Link
              href={editorMode ? '/editor' : '/'}
              className="text-lg font-medium transition-colors"
              style={{ color: '#ffffff' }}
            >
              <span className="hover:text-yellow-300">Inicio</span>
            </Link>
            <Link
              href={editorMode ? '/editor/buscar' : '/buscar'}
              className="text-lg font-medium transition-colors"
              style={{ color: '#ffffff' }}
            >
              <span className="hover:text-yellow-300">Buscar</span>
            </Link>
            <Link
              href="/recursos"
              className="text-lg font-medium transition-colors"
              style={{ color: '#ffffff' }}
            >
              <span className="hover:text-yellow-300">Recursos</span>
            </Link>
            <Link
              href="/acerca"
              className="text-lg font-medium transition-colors"
              style={{ color: '#ffffff' }}
            >
              <span className="hover:text-yellow-300">Acerca</span>
            </Link>
            {editorMode && (
              <Link
                href="/"
                className="text-lg font-medium transition-colors"
                style={{ color: '#ffffff' }}
              >
                <span className="hover:text-yellow-300">Diccionario Público</span>
              </Link>
            )}
            {editorMode && user && (
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
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
