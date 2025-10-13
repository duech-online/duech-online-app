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
      className="text-white hover:text-yellow-300 text-lg font-mediu    m transition-colors duration-200 px-3 py-1 border border-white border-opacity-30 rounded hover:border-opacity-50 cursor-pointer hover:bg-opacity-10"
      title="Cerrar sesión"
    >
      Cerrar sesión
    </button>
  );
}