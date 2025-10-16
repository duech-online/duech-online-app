import type { Metadata } from 'next';
import '@/app/globals.css';
import { dictionary } from '@/app/ui/fonts';
import Header from '@/app/ui/header';
import Footer from '@/app/ui/footer';

export const metadata: Metadata = {
  title: 'Diccionario del uso español de Chile',
  description: 'Diccionario del uso del español de Chile - DUECh Online',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={dictionary.className} style={{ backgroundColor: 'var(--background)' }}>
        <Header />
        <main className="min-h-screen bg-gray-50">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
