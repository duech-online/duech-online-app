import Link from 'next/link';
import Image from 'next/image';
import HeaderAuth from '@/app/ui/header-auth';
import { getSession } from '@/app/lib/auth';

export default async function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = await getSession();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-duech-blue shadow-lg">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/editor/buscar"
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
                  <div className="text-duech-gold">DUECh Editor</div>
                  <div className="text-xs font-normal text-gray-200">
                    Sistema de edición lexicográfica
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-8">
              <Link
                href="/editor"
                className="text-lg font-medium transition-colors"
                style={{ color: '#ffffff' }}
              >
                <span className="hover:text-yellow-300">Inicio Editor</span>
              </Link>
              <Link
                href="/"
                className="text-lg font-medium transition-colors"
                style={{ color: '#ffffff' }}
              >
                <span className="hover:text-yellow-300">Ver Diccionario Público</span>
              </Link>
              {isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <HeaderAuth />
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="min-h-screen">{children}</main>

      <footer style={{ backgroundColor: 'var(--footer-background)' }} className="py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-duech-gold mb-2 text-lg font-semibold">
              DUECh Editor - Sistema de edición lexicográfica
            </p>
            <p className="text-sm text-gray-300">
              Herramienta de edición para lexicógrafos y editores
            </p>
            <div className="mt-4 text-xs text-gray-400">Versión 0.1.0</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
