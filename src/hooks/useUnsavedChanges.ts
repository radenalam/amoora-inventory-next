'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter();
  const initialIsDirty = useRef(isDirty);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleRouteChange = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?');
      if (!confirmed) {
        router.push(window.location.pathname);
        throw 'route change aborted';
      }
    }
  }, [isDirty, router]);

  return { handleRouteChange };
}
