'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { cn } from '@/lib/cn';
import {
  bookingByType,
  bySource,
  ownerStats,
  ownerTransactions,
  revenueTrend,
  unitRevenue,
} from '@/lib/data/owner';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { DonutChart, RevenueLineChart, UnitBarChart } from './Charts';

type View = 'ringkasan' | 'penginapan' | 'laporan';

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-[#ece6d8] bg-white p-5.5', className)}>
      {children}
    </div>
  );
}

export function OwnerDashboard() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('ringkasan');
  const [range, setRange] = useState('rangeMonth');

  const navItems = [
    { key: 'ringkasan', icon: '▦', label: t('owner.navRingkasan'), soon: false },
    { key: 'penginapan', icon: '🛏', label: t('owner.navPenginapan'), soon: false },
    { key: 'tiket', icon: '🎫', label: t('owner.navTiket'), soon: true },
    { key: 'cafe', icon: '☕', label: t('owner.navCafe'), soon: true },
    { key: 'laporan', icon: '📊', label: t('owner.navLaporan'), soon: false },
  ];

  const ranges = ['rangeToday', 'rangeWeek', 'rangeMonth', 'rangeCustom'];

  return (
    <div className="flex min-h-screen bg-[#f4f1ea]">
      {/* Sidebar */}
      <aside className="hidden w-62 shrink-0 flex-col bg-[#1a1410] text-[#cbc3b5] md:flex">
        <div className="border-b border-[#D4A04A]/20 px-5.5 py-6">
          <div className="font-serif text-[19px] font-extrabold text-cream-100">
            D&apos;Glorious <span className="text-[#D4A04A]">Crater</span>
          </div>
          <div className="mt-1 text-[11px] tracking-[0.14em] text-[#D4A04A] uppercase">
            {t('owner.portal')}
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = view === item.key;
            return (
              <button
                key={item.key}
                disabled={item.soon}
                onClick={() => !item.soon && setView(item.key as View)}
                className={cn(
                  'flex items-center gap-3 rounded-[10px] border-l-[3px] px-3.5 py-3 text-left text-sm font-medium transition-colors',
                  active
                    ? 'border-[#D4A04A] bg-[#D4A04A]/20 text-white'
                    : 'border-transparent',
                  item.soon
                    ? 'cursor-not-allowed text-[#7d746a]'
                    : !active && 'text-[#b8ab9c] hover:bg-[#D4A04A]/10',
                )}
              >
                <span className="w-4.5 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <span className="rounded-[5px] bg-[#D4A04A]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#D4A04A]">
                    SOON
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <Link
          href="/login"
          className="m-3 flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-sm font-medium text-[#b8ab9c] hover:bg-[#D4A04A]/10"
        >
          <span className="w-4.5 text-center">⏻</span>
          {t('admin.logout')}
        </Link>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e8e2d5] bg-white px-5 md:px-8">
          <h1 className="text-forest-800 font-serif text-xl font-bold md:text-[22px]">
            {t('owner.title')}
          </h1>
          <div className="flex items-center gap-3.5">
            <LanguageSwitcher />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-[#1a1410] text-sm font-bold text-[#D4A04A]">
                HW
              </div>
              <div className="hidden sm:block">
                <div className="text-[13.5px] leading-tight font-semibold">
                  H. Wahyu Gunawan
                </div>
                <div className="mt-0.5 inline-block rounded-full bg-[#f6ecd8] px-2 py-0.5 text-[11px] text-[#9a7420]">
                  {t('owner.role')}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">
          {view === 'ringkasan' && (
            <>
              {/* Filter + export */}
              <div className="flex flex-wrap items-center justify-between gap-3.5">
                <div className="flex gap-1.5 rounded-xl border border-[#e8e2d5] bg-white p-1.5">
                  {ranges.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={cn(
                        'rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors',
                        range === r ? 'bg-forest-700 text-white' : 'text-muted',
                      )}
                    >
                      {t(`owner.${r}`)}
                    </button>
                  ))}
                </div>
                <button className="bg-terracotta-500 hover:bg-terracotta-600 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white">
                  {t('owner.export')}
                </button>
              </div>

              {/* Stat cards */}
              <div className="mt-5 grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
                {ownerStats.map((s) => (
                  <Panel key={s.key}>
                    <div className="text-muted text-[13px]">{t(`owner.${s.key}`)}</div>
                    <div className="text-forest-700 mt-1.5 font-serif text-[26px] font-extrabold">
                      {s.value}
                    </div>
                    <div
                      className={cn(
                        'mt-1 text-xs font-semibold',
                        s.up ? 'text-[#2f6b41]' : 'text-[#b23b30]',
                      )}
                    >
                      {s.up ? '▲' : '▼'} {s.delta} {t('owner.vsLastMonth')}
                    </div>
                  </Panel>
                ))}
              </div>

              {/* Line + bar */}
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <Panel>
                  <div className="text-base font-bold">{t('owner.revenueTrend')}</div>
                  <RevenueLineChart data={revenueTrend} />
                </Panel>
                <Panel>
                  <div className="text-base font-bold">{t('owner.revenuePerUnit')}</div>
                  <UnitBarChart bars={unitRevenue} />
                  <div className="mt-2 text-center text-[11.5px] text-[#a09a8c]">
                    {t('owner.notActiveYet')}
                  </div>
                </Panel>
              </div>

              {/* Donuts + transactions */}
              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr_1.4fr]">
                <Panel>
                  <div className="text-[15px] font-bold">{t('owner.bookingByType')}</div>
                  <DonutChart segments={bookingByType} />
                </Panel>
                <Panel>
                  <div className="text-[15px] font-bold">{t('owner.onlineVsWalkin')}</div>
                  <DonutChart segments={bySource} />
                </Panel>
                <Panel>
                  <div className="mb-3 text-[15px] font-bold">{t('owner.recentTx')}</div>
                  <div className="max-h-[270px] overflow-y-auto">
                    <table className="w-full text-left text-[12.5px]">
                      <thead className="text-muted text-[10.5px] uppercase">
                        <tr>
                          <th className="px-1.5 py-2">{t('owner.txCode')}</th>
                          <th className="px-1.5 py-2">{t('owner.txUnit')}</th>
                          <th className="px-1.5 py-2">{t('owner.txAmount')}</th>
                          <th className="px-1.5 py-2">{t('owner.txMethod')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ebe0]">
                        {ownerTransactions.map((tx) => (
                          <tr key={tx.kode}>
                            <td className="text-forest-700 px-1.5 py-2.5 font-semibold">
                              {tx.kode}
                            </td>
                            <td className="text-muted px-1.5 py-2.5">{tx.unit}</td>
                            <td className="px-1.5 py-2.5 font-semibold">{tx.amount}</td>
                            <td className="text-muted px-1.5 py-2.5">{tx.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            </>
          )}

          {view === 'penginapan' && (
            <Panel className="p-10 text-center text-muted">
              {t('owner.penginapanPlaceholder')}
            </Panel>
          )}
          {view === 'laporan' && (
            <Panel className="p-10 text-center text-muted">
              {t('owner.laporanPlaceholder')}
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}
