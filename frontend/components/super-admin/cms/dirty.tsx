'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type DirtyContextValue = {
  /** Satu editor melapor dirty / bersih. `id` unik per editor. */
  report: (id: string, dirty: boolean) => void;
  anyDirty: boolean;
};

const DirtyContext = createContext<DirtyContextValue>({ report: () => {}, anyDirty: false });

/**
 * Mengumpulkan status "ada perubahan belum disimpan" dari semua editor di
 * halaman. Dipakai dua hal: dialog bawaan browser saat tab ditutup/di-reload,
 * dan konfirmasi saat pindah halaman lewat menu panel (lihat SuperAdminLayout).
 */
export function DirtyProvider({ children }: { children: React.ReactNode }) {
  const dirtyIds = useRef(new Set<string>());
  const [anyDirty, setAnyDirty] = useState(false);

  const report = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyIds.current.add(id);
    else dirtyIds.current.delete(id);
    setAnyDirty(dirtyIds.current.size > 0);
  }, []);

  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [anyDirty]);

  const value = useMemo(() => ({ report, anyDirty }), [report, anyDirty]);
  return <DirtyContext.Provider value={value}>{children}</DirtyContext.Provider>;
}

export function useDirtyState() {
  return useContext(DirtyContext);
}

/** Editor memanggil ini setiap kali status dirty-nya berubah. */
export function useReportDirty(id: string, dirty: boolean) {
  const { report } = useContext(DirtyContext);
  useEffect(() => {
    report(id, dirty);
    return () => report(id, false);
  }, [id, dirty, report]);
}
