'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, TBody, Td, Th, THead, Table, Tr } from '@/components/ui';
import { adminBookings, type AdminBooking } from '@/lib/data/admin';
import { formatDate, formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { SourceBadge, StatusBadge } from './StatusBadge';

export function BookingsPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AdminBooking | null>(null);

  return (
    <DashboardLayout title={t('dashboard.bookings')}>
      {/* Filter bar */}
      <div className="border-border flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4">
        <input
          placeholder={t('admin.searchPlaceholder')}
          className="border-input min-w-[200px] flex-1 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] outline-none focus:border-forest-500"
        />
        <input type="date" defaultValue="2026-07-01" className="border-input rounded-[10px] border px-3 py-2.5 text-[13px]" />
        <span className="text-muted">–</span>
        <input type="date" defaultValue="2026-07-31" className="border-input rounded-[10px] border px-3 py-2.5 text-[13px]" />
        <select className="border-input rounded-[10px] border bg-white px-3 py-2.5 text-[13px]">
          <option>{t('admin.allStatus')}</option>
          <option>Confirmed</option>
          <option>Menunggu</option>
          <option>Expired</option>
        </select>
        <select className="border-input rounded-[10px] border bg-white px-3 py-2.5 text-[13px]">
          <option>{t('admin.allSource')}</option>
          <option>{t('admin.online')}</option>
          <option>{t('admin.walkin')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4">
        <Table>
          <THead>
            <Tr>
              <Th>{t('admin.tCode')}</Th>
              <Th>{t('admin.tGuest')}</Th>
              <Th>{t('admin.tWa')}</Th>
              <Th>{t('admin.tType')}</Th>
              <Th>{t('admin.tCheckIn')}</Th>
              <Th>{t('admin.tCheckOut')}</Th>
              <Th>{t('admin.tSource')}</Th>
              <Th>{t('admin.tTotal')}</Th>
              <Th>{t('admin.tStatus')}</Th>
              <Th></Th>
            </Tr>
          </THead>
          <TBody>
            {adminBookings.map((b) => (
              <Tr key={b.kode} onClick={() => setSelected(b)} className="cursor-pointer">
                <Td className="text-forest-700 font-semibold">{b.kode}</Td>
                <Td>{b.guest}</Td>
                <Td className="text-muted">{b.wa}</Td>
                <Td className="text-muted">{b.room}</Td>
                <Td>{formatDate(b.checkIn)}</Td>
                <Td>{formatDate(b.checkOut)}</Td>
                <Td>
                  <SourceBadge source={b.source} />
                </Td>
                <Td className="font-semibold">{formatIDR(b.total)}</Td>
                <Td>
                  <StatusBadge status={b.status} />
                </Td>
                <Td className="text-accent font-semibold whitespace-nowrap">
                  {t('admin.detail')} ›
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>

      {selected && <DetailModal booking={selected} onClose={() => setSelected(null)} />}
    </DashboardLayout>
  );
}

function DetailModal({
  booking,
  onClose,
}: {
  booking: AdminBooking;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-5">
      <button aria-hidden tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#141916]/50" />
      <div className="relative z-10 w-[520px] max-w-full overflow-hidden rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eee] px-6 py-5">
          <div>
            <div className="text-muted text-xs">{t('admin.dmTitle')}</div>
            <div className="text-forest-700 font-serif text-2xl font-extrabold">
              {booking.kode}
            </div>
          </div>
          <button onClick={onClose} className="text-xl text-[#999]" aria-label="Tutup">
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="mb-3.5 flex justify-end">
            <StatusBadge status={booking.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label={t('admin.tGuest')} value={booking.guest} />
            <Field label={t('admin.tWa')} value={booking.wa} />
            <Field label={t('admin.tType')} value={booking.room} />
            <Field label={t('admin.tTotal')} value={formatIDR(booking.total)} valueClass="text-forest-700" />
            <Field label={t('admin.tCheckIn')} value={formatDate(booking.checkIn)} />
            <Field label={t('admin.tCheckOut')} value={formatDate(booking.checkOut)} />
          </div>
          <div className="mt-6 flex gap-2.5">
            <Button fullWidth className="rounded-xl">
              {t('admin.dmConfirm')}
            </Button>
            <Button variant="outline" className="rounded-xl">
              {t('admin.dmContactWa')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-muted text-xs">{label}</div>
      <div className={`font-semibold ${valueClass ?? ''}`}>{value}</div>
    </div>
  );
}
