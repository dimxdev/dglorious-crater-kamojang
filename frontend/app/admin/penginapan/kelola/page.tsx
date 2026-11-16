'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTranslation } from '@/lib/i18n/I18nProvider';

/**
 * Kelola tenda sudah pindah ke panel Super Admin. Alamat lama ini dipertahankan
 * supaya bookmark/tautan lama tidak 404: SUPER_ADMIN diarahkan ke halaman
 * barunya, role lain ke dashboard penginapan (mereka hanya membaca tipe unit).
 */
export default function AdminKelolaRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user?.role === 'SUPER_ADMIN' ? '/super-admin/penginapan' : '/admin/penginapan');
  }, [isLoading, user, router]);

  return (
    <div role="status" className="text-muted flex min-h-screen items-center justify-center text-sm">
      {t('superAdmin.cms.redirecting')}
    </div>
  );
}
