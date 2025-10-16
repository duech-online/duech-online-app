import Header from '@/app/ui/header';
import Footer from '@/app/ui/footer';

export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header editorMode />

      <main className="min-h-screen">{children}</main>

      <Footer editorMode />
    </div>
  );
}
