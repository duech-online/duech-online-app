'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function HeaderAuth() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href="/login"
          className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Iniciar sesión
        </a>
        <a
          href="/register"
          className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Registrarse
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/80">{user.name || user.email}</span>
      <button
        onClick={handleLogout}
        className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
