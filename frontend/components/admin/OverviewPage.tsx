'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, TBody, Td, Th, THead, Table, Tr } from '@/components/ui';
import {
  adminBookings,
  bookingsOnDate,
  cmsRooms,
  effectiveStatus,
  getRecentBookings,
  occupiedQtyOnDate,
  roomsSummary,
} from '@/lib/data/admin';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { SourceBadge, StatusBadge } from './StatusBadge';

const WEEK = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

export function OverviewPage() {
  const { t, locale } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const todayMonth = todayISO.slice(0, 7);

  const totalCapacity = cmsRooms.reduce((sum, r) => sum + r.units, 0);
  const bookingsToday = adminBookings.filter((b) => b.checkIn === todayISO).length;
  const belumLunas = adminBookings.filter((b) => effectiveStatus(b) === 'DP').length;
  const occupiedToday = occupiedQtyOnDate(adminBookings, todayISO);
  const occupancyPct = totalCapacity > 0 ? Math.round((occupiedToday / totalCapacity) * 100) : 0;
  const revenueThisMonth = adminBookings
    .filter((b) => b.checkIn.slice(0, 7) === todayMonth)
    .reduce((sum, b) => sum + b.total, 0);

  const stats = [
    { label: t('admin.overviewStatToday'), value: String(bookingsToday), sub: t('admin.arrivingToday') },
    { label: t('admin.overviewStatPending'), value: String(belumLunas), sub: t('admin.needFollowUp') },
    { label: t('admin.overviewStatOccupancy'), value: `${occupancyPct}%`, bar: occupancyPct },
    { label: t('admin.overviewStatRevenue'), value: formatIDR(revenueThisMonth), sub: t('admin.thisMonth') },
  ];

  const recentBookings = getRecentBookings(adminBookings, 5);

  // Kalender: bulan berjalan, minggu mulai Senin (WEEK: S S R K J S M).
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(today);

  const selectedBookings = selectedDate ? bookingsOnDate(adminBookings, selectedDate) : [];
  const selectedOccupied = selectedDate ? occupiedQtyOnDate(adminBookings, selectedDate) : 0;

  return (
    <DashboardLayout title={t('dashboard.overview')}>
      {/* Stat cards */}
      <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent>
              <div className="text-muted text-[13px]">{s.label}</div>
              <div className="text-forest-700 mt-1.5 font-serif text-2xl leading-tight font-extrabold wrap-break-word">
                {s.value}
              </div>
              {s.bar !== undefined ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee]">
                  <div className="bg-forest-700 h-full" style={{ width: `${Math.min(100, s.bar)}%` }} />
                </div>
              ) : (
                <div className="text-muted mt-1 text-xs font-medium">{s.sub}</div>
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
                  <Th>{t('admin.tSource')}</Th>
                  <Th>{t('admin.tStatus')}</Th>
                </Tr>
              </THead>
              <TBody>
                {recentBookings.map((b) => (
                  <Tr key={b.kode}>
                    <Td className="text-forest-700 font-semibold">{b.kode}</Td>
                    <Td>{b.guest}</Td>
                    <Td className="text-muted">{roomsSummary(b.rooms)}</Td>
                    <Td>
                      <SourceBadge source={b.source} />
                    </Td>
                    <Td>
                      <StatusBadge status={effectiveStatus(b)} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="font-serif text-base font-bold">
              {t('admin.occupancyCalendarTitle', { month: monthLabel })}
            </div>
            <div className="text-muted mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px]">
              {WEEK.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOffset }, (_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateISO = toISO(year, monthIndex, day);
                const occupied = occupiedQtyOnDate(adminBookings, dateISO);
                const full = totalCapacity > 0 && occupied >= totalCapacity;
                const empty = occupied === 0;
                const isSelected = dateISO === selectedDate;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(dateISO)}
                    className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
                      full
                        ? 'bg-cream-200 text-[#b7b0a0]'
                        : empty
                          ? 'bg-forest-50 text-forest-700'
                          : 'bg-[#FBEFD5] text-[#8a6d1f]'
                    } ${isSelected ? 'ring-forest-700 ring-2' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="text-muted mt-3.5 flex gap-3.5 text-[11.5px]">
              <span>
                <span className="text-forest-700">▪</span> {t('admin.available')}
              </span>
              <span className="text-[#8a6d1f]">▪ {t('admin.partial')}</span>
              <span className="text-[#b7b0a0]">▪ {t('admin.full')}</span>
            </div>

            {selectedDate && (
              <div className="border-border mt-4 rounded-xl border p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                    }).format(new Date(selectedDate))}
                  </span>
                  <span className="text-muted text-xs">
                    {t('admin.unitsOccupied', { occupied: selectedOccupied, total: totalCapacity })}
                  </span>
                </div>
                {selectedBookings.length > 0 ? (
                  <div className="mt-2.5 flex flex-col gap-2">
                    {selectedBookings.map((b) => (
                      <div key={b.kode} className="flex items-center justify-between text-[12.5px]">
                        <div>
                          <span className="text-forest-700 font-semibold">{b.kode}</span>{' '}
                          <span className="text-muted">
                            {b.guest} · {roomsSummary(b.rooms)}
                          </span>
                        </div>
                        <StatusBadge status={effectiveStatus(b)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mt-2 text-[12.5px]">{t('admin.noBookingsOnDate')}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
