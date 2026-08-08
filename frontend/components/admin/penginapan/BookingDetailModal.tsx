'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { type AdminBookingDetail } from '@/lib/api/bookings';
import { roomItemLabel, type BookingChannel, type BookingRoomItem, type BookingStatus } from '@/lib/data/admin';
import { formatDate, formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { StatusBadge } from './StatusBadge';

/**
 * Bentuk tampilan dipetakan dari `AdminBookingDetail` (API, FASE 7/8) — field
 * lama (`kode`/`guest`/`wa`/dst) dipertahankan biar fungsi yang sudah ada di
 * `lib/data/admin.ts` (`roomsSummary` dkk) & `lib/data/owner.ts`
 * (`bookingsInRange`) tetap kepakai apa adanya, cuma sumber datanya diganti.
 * `raw` nyimpen objek API asli buat detail modal (per-tenda adults/children/
 * extra-bed, `paidTotal`, `effectiveStatus`). Dipakai bareng `BookingsPage.tsx`
 * (Data Booking) & `OverviewPage.tsx` (Ringkasan, transaksi hari ini).
 */
export type DisplayBooking = {
  kode: string;
  guest: string;
  wa: string;
  rooms: BookingRoomItem[];
  createdAt: string;
  checkIn: string;
  checkOut: string;
  source: BookingChannel;
  total: number;
  raw: AdminBookingDetail;
};

export function toDisplay(b: AdminBookingDetail): DisplayBooking {
  return {
    kode: b.bookingCode,
    guest: b.guestName,
    wa: b.guestPhone,
    rooms: b.items.map((i) => ({ slug: i.roomTypeSlug, qty: 1 })),
    // API balikin ISO datetime penuh ("...T00:00:00.000Z") — dipotong ke
    // YYYY-MM-DD biar cocok sama `bookingsInRange`/filter tanggal yang
    // membandingkan string apa adanya (bukan objek Date).
    createdAt: b.createdAt.slice(0, 10),
    checkIn: b.checkIn.slice(0, 10),
    checkOut: b.checkOut.slice(0, 10),
    source: b.bookingChannel as BookingChannel,
    total: b.priceSnapshot,
    raw: b,
  };
}

/** Status tampilan — langsung dari API (`computeEffectiveStatus()`, FASE 7), bukan dihitung ulang di sini. */
export function displayStatus(b: DisplayBooking): BookingStatus {
  return b.raw.effectiveStatus as BookingStatus;
}

export function BookingDetailModal({
  booking,
  onClose,
  onMarkLunas,
  onMarkCheckedIn,
  onMarkCompleted,
  onMarkNoShow,
  onMarkHangus,
}: {
  booking: DisplayBooking;
  onClose: () => void;
  onMarkLunas: () => Promise<void>;
  onMarkCheckedIn: () => Promise<void>;
  onMarkCompleted: () => Promise<void>;
  onMarkNoShow: () => Promise<void>;
  onMarkHangus: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = displayStatus(booking);
  const { raw } = booking;
  const waHref = `https://wa.me/${booking.wa}?text=${encodeURIComponent(
    `Halo ${booking.guest}, terkait booking ${booking.kode} di D'Glorious Crater.`,
  )}`;

  async function runUpdate(action: () => Promise<void>) {
    setError(null);
    setUpdating(true);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('admin.saveError'));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-5">
      <button aria-hidden tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#141916]/50" />
      <div className="relative z-10 flex max-h-[90vh] w-140 max-w-full flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eee] px-6 py-5">
          <div>
            <div className="text-muted text-xs">{t('admin.dmTitle')}</div>
            <div className="mt-0.5 flex items-center gap-2.5">
              <span className="text-forest-700 font-serif text-2xl font-extrabold">
                {booking.kode}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
          <button onClick={onClose} className="text-xl text-[#999]" aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            <Section title={t('admin.dmSectionGuest')}>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('admin.tGuest')} value={booking.guest} />
                <Field label={t('admin.tWa')} value={booking.wa} />
              </div>
            </Section>

            <Section title={t('admin.dmSectionStay')}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="text-muted text-xs">{t('admin.tType')}</div>
                  <div className="flex flex-col gap-0.5">
                    {booking.rooms.map((item, i) => (
                      <div key={i} className="font-semibold">
                        {roomItemLabel(item)}
                      </div>
                    ))}
                  </div>
                </div>
                <Field label={t('admin.tBookingDate')} value={formatDate(booking.createdAt)} />
                <Field label={t('admin.tCheckIn')} value={formatDate(booking.checkIn)} />
                <Field label={t('admin.tCheckOut')} value={formatDate(booking.checkOut)} />
                {/* Dewasa/anak/extra-bed sekarang per-tenda (FASE 7/8) — satu baris per item, bukan satu angka gabungan. */}
                {raw.items.map((item, i) => (
                  <div key={i} className="col-span-2 border-t border-dashed border-[#eee] pt-2 first:border-t-0 first:pt-0">
                    <div className="text-muted text-xs">{roomItemLabel({ slug: item.roomTypeSlug, qty: 1 })}</div>
                    <div className="text-[13.5px]">
                      {t('admin.adults')}: {item.adults} · {t('admin.children')}: {item.children}
                      {item.extraBedQty > 0 && (
                        <>
                          {' '}
                          · {item.extraBedQty}× {item.extraBedType === 'WITHOUT_BED' ? t('admin.withoutBed') : t('admin.withBed')}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {raw.notes && (
                  <div className="col-span-2">
                    <Field label={t('admin.notes')} value={raw.notes} />
                  </div>
                )}
              </div>
            </Section>

            <Section title={t('admin.dmSectionPayment')}>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('admin.tTotal')} value={formatIDR(booking.total)} valueClass="text-forest-700" />
                <Field
                  label={t('admin.paidAmount')}
                  value={`${formatIDR(raw.paidTotal)} / ${formatIDR(booking.total)}`}
                  valueClass={raw.paidTotal >= booking.total ? 'text-[#2f6b41]' : 'text-[#c8952e]'}
                />
              </div>
            </Section>

            {status === 'CHECKED_IN' && (
              <p className="text-muted text-[12.5px]">{t('admin.dmAutoCompleteNote')}</p>
            )}
            {status === 'LUNAS' && (
              <p className="text-muted text-[12.5px]">{t('admin.dmAutoNoShowNote')}</p>
            )}
            {status === 'DP' && (
              <p className="text-muted text-[12.5px]">{t('admin.dmAutoHangusNote')}</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap gap-2.5">
              {status === 'DP' && (
                <Button className="rounded-xl" onClick={() => runUpdate(onMarkLunas)} disabled={updating}>
                  {updating ? t('admin.saving') : t('admin.dmMarkLunas')}
                </Button>
              )}
              {status === 'LUNAS' && (
                <Button className="rounded-xl" onClick={() => runUpdate(onMarkCheckedIn)} disabled={updating}>
                  {updating ? t('admin.saving') : t('admin.dmMarkCheckedIn')}
                </Button>
              )}
              {status === 'CHECKED_IN' && (
                <Button className="rounded-xl" onClick={() => runUpdate(onMarkCompleted)} disabled={updating}>
                  {updating ? t('admin.saving') : t('admin.dmMarkCompleted')}
                </Button>
              )}
              {status === 'DP' && (
                <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" onClick={() => runUpdate(onMarkHangus)} disabled={updating}>
                  {updating ? t('admin.saving') : t('admin.dmMarkHangus')}
                </Button>
              )}
              {status === 'LUNAS' && (
                <Button variant="outline" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => runUpdate(onMarkNoShow)} disabled={updating}>
                  {updating ? t('admin.saving') : t('admin.dmMarkNoShow')}
                </Button>
              )}
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-xl">
                  {t('admin.dmContactWa')}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted mb-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
        {title}
      </div>
      {children}
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
