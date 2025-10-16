import Header from '@/app/ui/header';
import Footer from '@/app/ui/footer';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">{children}</main>

      <Footer />
    </>
  );
}
