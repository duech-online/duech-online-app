import Header from '@/app/ui/header';

export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header editorMode />

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
