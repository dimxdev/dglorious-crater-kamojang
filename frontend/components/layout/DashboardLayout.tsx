'use client';

import { useTranslation } from '@/lib/i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Sidebar } from './Sidebar';

type DashboardLayoutProps = {
  title: string;
  children: React.ReactNode;
};

/** Layout dashboard admin: sidebar + header + konten (bg #F4F1EA). */
export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-[#f4f1ea]">
      <Sidebar className="hidden md:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-5 md:px-8">
          <h1 className="text-forest-800 font-serif text-xl font-bold md:text-[22px]">
            {title}
          </h1>
          <div className="flex items-center gap-3.5">
            <LanguageSwitcher />
            <span className="cursor-pointer text-xl">🔔</span>
            <div className="flex items-center gap-2.5">
              <div className="bg-forest-700 flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-bold text-white">
                RA
              </div>
              <div className="hidden sm:block">
                <div className="text-[13.5px] leading-tight font-semibold">
                  Reza Anggara
                </div>
                <div className="mt-0.5 inline-block rounded-full bg-[#E4F1E7] px-2 py-0.5 text-[11px] text-[#2f6b41]">
                  {t('admin.role')}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
