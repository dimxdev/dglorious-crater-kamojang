'use client';

import { SuperAdminLayout } from '@/components/super-admin/SuperAdminLayout';
import { SectionsProvider } from '@/components/super-admin/cms/SectionEditor';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export type TocEntry = { id: string; label: string };

/** Teks judul + deskripsi kartu section, dari i18n `superAdmin.s.<key>.*`. */
export function useSectionText() {
  const { t } = useTranslation();
  return (key: string) => ({
    title: t(`superAdmin.s.${key}.title`),
    description: t(`superAdmin.s.${key}.desc`),
  });
}

/** Teks koleksi dari i18n `superAdmin.c.<COLLECTION>.*`. */
export function useCollectionText() {
  const { t } = useTranslation();
  return (c: string) => ({
    title: t(`superAdmin.c.${c}.title`),
    description: t(`superAdmin.c.${c}.desc`),
    addLabel: t(`superAdmin.c.${c}.add`),
    emptyText: t(`superAdmin.c.${c}.empty`),
    noun: t(`superAdmin.c.${c}.noun`),
  });
}

/**
 * Kerangka halaman konten: layout panel + satu fetch section untuk semua kartu
 * di halaman + daftar isi (anchor) bila kartunya banyak.
 */
export function ContentPage({
  title,
  descriptionKey,
  viewHref,
  toc,
  children,
}: {
  title: string;
  descriptionKey: string;
  viewHref: string;
  toc: TocEntry[];
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <SuperAdminLayout
      title={title}
      group={t('superAdmin.nav.groupContent')}
      description={t(descriptionKey)}
      viewHref={viewHref}
    >
      {toc.length >= 4 && (
        <nav aria-label={t('superAdmin.cms.onThisPage')} className="mb-6 -mt-2">
          <p className="text-muted mb-1.5 text-[12px] font-semibold">{t('superAdmin.cms.onThisPage')}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {toc.map((e) => (
              <li key={e.id}>
                <a
                  href={`#${e.id}`}
                  className="inline-flex min-h-8 items-center rounded-sm text-[13px] font-medium text-sky-800 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:outline-none"
                >
                  {e.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <SectionsProvider>
        <div className="flex flex-col gap-6">{children}</div>
      </SectionsProvider>
    </SuperAdminLayout>
  );
}

/** Hapus kunci opsional bila teks dwibahasa kosong (backend menolak L dengan `id` kosong). */
export function optionalL<T extends object, K extends keyof T>(obj: T, key: K, value: { id: string; en: string }): T {
  const next = { ...obj };
  if (value.id.trim() === '' && value.en.trim() === '') {
    delete next[key];
  } else {
    (next as Record<K, unknown>)[key] = value;
  }
  return next;
}
