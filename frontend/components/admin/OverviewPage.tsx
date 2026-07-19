'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, TBody, Td, Th, THead, Table, Tr } from '@/components/ui';
import { recentBookings } from '@/lib/data/admin';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { StatusBadge } from './StatusBadge';

const FULL_DAYS = new Set([5, 6, 12, 13, 19, 20, 26]);
const WEEK = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

export function OverviewPage() {
  const { t } = useTranslation();

  const stats = [
    { label: t('admin.overviewStatToday'), value: '12', sub: `▲ 3 ${t('admin.fromYesterday')}`, subClass: 'text-emerald-600', color: 'text-forest-700' },
    { label: t('admin.overviewStatPending'), value: '3', sub: t('admin.needFollowUp'), subClass: 'text-amber-600', color: 'text-terracotta-500' },
    { label: t('admin.overviewStatOccupancy'), value: '78%', bar: 78, color: 'text-forest-700' },
    { label: t('admin.overviewStatRevenue'), value: 'Rp312 jt', sub: `▲ 16% ${t('admin.vsLastMonth')}`, subClass: 'text-emerald-600', color: 'text-forest-700' },
  ];

  return (
    <DashboardLayout title={t('dashboard.overview')}>
      {/* Stat cards */}
      <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent>
              <div className="text-muted text-[13px]">{s.label}</div>
              <div className={`mt-1.5 font-serif text-[32px] font-extrabold ${s.color}`}>
                {s.value}
              </div>
              {s.bar !== undefined ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee]">
                  <div className="bg-forest-700 h-full" style={{ width: `${s.bar}%` }} />
                </div>
              ) : (
                <div className={`mt-1 text-xs font-medium ${s.subClass}`}>{s.sub}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent + calendar */}
      <div className="mt-5.5 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardContent>
            <div className="mb-3.5 font-serif text-base font-bold">
              {t('admin.recentBookings')}
            </div>
            <Table>
              <THead>
                <Tr>
                  <Th>{t('admin.tCode')}</Th>
                  <Th>{t('admin.tGuest')}</Th>
                  <Th>{t('admin.tType')}</Th>
                  <Th>{t('admin.tStatus')}</Th>
                </Tr>
              </THead>
              <TBody>
                {recentBookings.map((b) => (
                  <Tr key={b.kode}>
                    <Td className="text-forest-700 font-semibold">{b.kode}</Td>
                    <Td>{b.guest}</Td>
                    <Td className="text-muted">{b.room}</Td>
                    <Td>
                      <StatusBadge status={b.status} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="font-serif text-base font-bold">{t('admin.occupancyJuly')}</div>
            <div className="text-muted mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px]">
              {WEEK.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              <div className="col-span-2" />
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const full = FULL_DAYS.has(day);
                return (
                  <div
                    key={day}
                    className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-medium ${
                      full ? 'bg-cream-200 text-[#b7b0a0]' : 'bg-forest-50 text-forest-700'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="text-muted mt-3.5 flex gap-3.5 text-[11.5px]">
              <span>
                <span className="text-forest-700">▪</span> {t('admin.available')}
              </span>
              <span className="text-[#b7b0a0]">▪ {t('admin.full')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
