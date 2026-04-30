'use client';

import { useStore } from '@/store/useStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';

function useIsAuthenticated() {
  const store = useStore;

  const token = useSyncExternalStore(
    (cb) => {
      window.addEventListener('storage', cb);
      return () => window.removeEventListener('storage', cb);
    },
    () => localStorage.getItem('amoora_token'),
    () => null,
  );

  const isAuthenticated = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getState().isAuthenticated,
    () => false,
  );

  return !!token && isAuthenticated;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    useStore.getState().checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
