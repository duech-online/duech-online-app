import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Diccionario del Español de Chile",
  description: "Diccionario del uso del español de Chile - DUECh Online",
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
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-white hover:text-duech-gold transition-colors flex items-center gap-3">
                  <span className="text-3xl">📚</span>
                  <div>
                    <div className="text-duech-gold">DUECh</div>
                    <div className="text-xs font-normal text-gray-200">Diccionario del Español de Chile</div>
                  </div>
                </Link>
              </div>
              
              <div className="flex items-center space-x-8">
                <Link 
                  href="/" 
                  className="font-medium text-lg transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  <span className="hover:text-yellow-300">Inicio</span>
                </Link>
                <Link 
                  href="/busqueda-avanzada" 
                  className="font-medium text-lg transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  <span className="hover:text-yellow-300">Búsqueda Avanzada</span>
                </Link>
                <Link 
                  href="/recursos" 
                  className="font-medium text-lg transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  <span className="hover:text-yellow-300">Recursos</span>
                </Link>
                <Link 
                  href="/acerca" 
                  className="font-medium text-lg transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  <span className="hover:text-yellow-300">Acerca</span>
                </Link>
              </div>
            </div>
          </nav>
        </header>
        
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        
        <footer style={{ backgroundColor: 'var(--footer-background)' }} className="text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-lg font-semibold text-duech-gold mb-2">
                Diccionario del uso del español de Chile (DUECh)
              </p>
              <p className="text-sm text-gray-300">
                Proyecto de digitalización del patrimonio lingüístico chileno
              </p>
              <div className="mt-4 text-xs text-gray-400">
                MVP - Versión 0.1.0
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
