'use client';
import { useAuthContext } from '@/providers/AuthProvider';

export function useAuth() {
  const { user, login, logout, isAuthorized, isLoading } = useAuthContext();

  return {
    user,
    login,
    logout,
    isAuthorized,
    isLoading,
  };
}

// Export the type for compatibility
export type { User } from '@/providers/AuthProvider';
