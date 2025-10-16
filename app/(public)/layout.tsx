import Header from '@/app/ui/header';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">{children}</main>

      <footer style={{ backgroundColor: 'var(--footer-background)' }} className="py-12 text-white">
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
    </>
  );
}
