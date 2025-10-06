import type { Metadata } from 'next';
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
        {children}
      </body>
    </html>
  );
}
