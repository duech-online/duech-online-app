import { ReactNode } from 'react';
import { isEditorMode } from '@/app/lib/editor-mode-server';
import Header from '@/app/ui/header';
import Footer from '@/app/ui/footer';

export default async function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const editorMode = await isEditorMode();

  return (
    <>
      <Header editorMode={editorMode} />
      <main className="min-h-screen bg-gray-50">{children}</main>
      <Footer editorMode={editorMode} />
    </>
  );
}
