import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import HeaderAuth from '@/app/ui/HeaderAuth';

import '@/app/globals.css';
import { inter } from '@/app/ui/fonts';

export const metadata: Metadata = {
  title: 'Diccionario del Español de Chile',
  description: 'Diccionario del uso del español de Chile - DUECh Online',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className}`} style={{ backgroundColor: 'var(--background)' }}>
        <header className="bg-duech-blue shadow-lg">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/"
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
                    <div className="text-duech-gold">DUECh</div>
                    <div className="text-xs font-normal text-gray-200">
                      Diccionario del Español de Chile
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-lg font-medium transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  <span className="hover:text-yellow-300">Inicio</span>
                </Link>
                <Link
                  href="/busqueda-avanzada"
                  className="text-lg font-medium transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  <span className="hover:text-yellow-300">Búsqueda Avanzada</span>
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
                <HeaderAuth />
              </div>
            </div>
          </nav>
        </header>

        <main className="min-h-screen bg-gray-50">{children}</main>

        <footer
          style={{ backgroundColor: 'var(--footer-background)' }}
          className="py-12 text-white"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-duech-gold mb-2 text-lg font-semibold">
                Diccionario del uso del español de Chile (DUECh)
              </p>
              <p className="text-sm text-gray-300">
                Proyecto de digitalización del patrimonio lingüístico chileno
              </p>
              <div className="mt-4 text-xs text-gray-400">MVP - Versión 0.1.0</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
