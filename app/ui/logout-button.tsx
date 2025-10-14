'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        router.push(data.redirectTo || '/editor');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/editor');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="font-mediu m border-opacity-30 hover:border-opacity-50 hover:bg-opacity-10 cursor-pointer rounded border border-white px-3 py-1 text-lg text-white transition-colors duration-200 hover:text-yellow-300"
      title="Cerrar sesión"
    >
      Cerrar sesión
    </button>
  );
}
