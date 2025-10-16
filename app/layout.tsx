import type { Metadata } from 'next';
import '@/app/globals.css';
import { dictionary } from '@/app/ui/fonts';
import Header from '@/app/ui/header';
import Footer from '@/app/ui/footer';
import { isEditorMode } from '@/app/lib/editor-mode-server';

export const metadata: Metadata = {
  title: 'Diccionario del uso español de Chile',
  description: 'Diccionario del uso del español de Chile - DUECh Online',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const editorMode = await isEditorMode();

  return (
    <html lang="es">
      <body className={dictionary.className} style={{ backgroundColor: 'var(--background)' }}>
        <Header editorMode={editorMode} />
        <main className="min-h-screen bg-gray-50">{children}</main>
        <Footer editorMode={editorMode} />
      </body>
    </html>
  );
}
