'use client';

import {
  ArrowRight,
  Ban,
  CheckCheck,
  CircleCheckBig,
  LogIn,
  MessageCircle,
  Pencil,
  UserX,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { fetchAdminRoomTypes } from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { type AdminBookingDetail } from '@/lib/api/bookings';
import { cn } from '@/lib/cn';
import { roomItemLabel, type BookingChannel, type BookingRoomItem, type BookingStatus } from '@/lib/data/admin';
import { formatDate, formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { SourceBadge, StatusBadge } from './StatusBadge';

/**
 * Bentuk tampilan dipetakan dari `AdminBookingDetail` (API) — field
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
    rooms: b.items.map((i) => ({
      slug: i.roomTypeSlug,
      qty: 1,
      name: i.roomTypeName,
      category: i.roomTypeCategory,
    })),
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

/** Status tampilan — langsung dari API (`computeEffectiveStatus()`), bukan dihitung ulang di sini. */
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
  const router = useRouter();
  const { token } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});

  useBodyScrollLock(true);

  const hasEditLogs = booking.raw.editLogs.length > 0;
  useEffect(() => {
    if (!token || !hasEditLogs) return;
    fetchAdminRoomTypes(token)
      .then((list) => setRoomNames(Object.fromEntries(list.map((r) => [r.slug, `${r.name} — ${r.category}`]))))
      .catch(() => {
        // Label jatuh ke slug kalau daftar tipe gagal dimuat.
      });
  }, [token, hasEditLogs]);

  const status = displayStatus(booking);
  const { raw } = booking;
  const waHref = `https://wa.me/${booking.wa}?text=${encodeURIComponent(
    `Halo ${booking.guest}, terkait booking ${booking.kode} di D'Glorious Crater.`,
  )}`;

  const nights = Math.max(
    1,
    Math.round(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
        86_400_000,
    ),
  );
  const outstanding = booking.total - raw.paidTotal;

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

  // Catatan otomatis per status — cuma satu yang relevan pada satu waktu.
  const autoNote =
    status === 'CHECKED_IN'
      ? t('admin.dmAutoCompleteNote')
      : status === 'LUNAS'
        ? t('admin.dmAutoNoShowNote')
        : status === 'DP'
          ? t('admin.dmAutoHangusNote')
          : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-5">
      <button aria-hidden tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#141916]/50" />
      <div className="relative z-10 flex max-h-[90vh] w-140 max-w-full flex-col overflow-hidden rounded-[16px] bg-white shadow-2xl">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="border-border flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-muted text-[11px] font-semibold tracking-[0.06em] uppercase">
              {t('admin.dmTitle')}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-forest-700 font-serif text-[22px] leading-none font-extrabold">
                {booking.kode}
              </span>
              <StatusBadge status={status} />
              <SourceBadge source={booking.source} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted hover:bg-cream-100 hover:text-foreground -mt-1 -mr-1.5 shrink-0 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} strokeWidth={2.2} aria-hidden />
          </button>
        </div>

        {/* ── Isi (scroll) ───────────────────────────────────────── */}
        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          <Section title={t('admin.dmSectionGuest')}>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('admin.tGuest')} value={booking.guest} />
              <Field label={t('admin.tWa')} value={booking.wa} />
            </div>
          </Section>

          <Section title={t('admin.dmSectionStay')}>
            <div className="flex flex-col gap-3">
              {/* Rentang inap — dibikin satu strip biar langsung kebaca
                  "dari kapan sampai kapan, berapa malam". */}
              <div className="border-border flex items-center gap-3 rounded-[10px] border bg-cream-50 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-muted text-[11px]">{t('admin.tCheckIn')}</div>
                  <div className="truncate text-[13.5px] font-semibold">
                    {formatDate(booking.checkIn)}
                  </div>
                </div>
                <div className="text-muted flex shrink-0 flex-col items-center gap-0.5">
                  <ArrowRight size={15} strokeWidth={2} aria-hidden />
                  <span className="text-[10.5px] font-semibold whitespace-nowrap">
                    {nights} malam
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-muted text-[11px]">{t('admin.tCheckOut')}</div>
                  <div className="truncate text-[13.5px] font-semibold">
                    {formatDate(booking.checkOut)}
                  </div>
                </div>
              </div>

              {/* Satu kartu per tenda — nama tipe & jumlah orangnya jadi
                  nyatu, gak kepisah kayak sebelumnya. */}
              <div className="flex flex-col gap-2">
                {raw.items.map((item, i) => (
                  <div
                    key={i}
                    className="border-border rounded-[10px] border px-3.5 py-2.5"
                  >
                    <div className="text-[13.5px] font-semibold">
                      {roomItemLabel({ slug: item.roomTypeSlug, name: item.roomTypeName, category: item.roomTypeCategory, qty: 1 })}
                    </div>
                    <div className="text-muted mt-0.5 text-[12.5px]">
                      {item.adults} {t('admin.adultsShort')} · {item.children}{' '}
                      {t('admin.childrenShort')}
                      {item.extraBedQty > 0 && (
                        <>
                          {' '}
                          · {item.extraBedQty}×{' '}
                          {item.extraBedType === 'WITHOUT_BED'
                            ? t('admin.withoutBed')
                            : t('admin.withBed')}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label={t('admin.tBookingDate')}
                  value={formatDate(booking.createdAt)}
                />
                {raw.notes && (
                  <Field label={t('admin.dmNotes')} value={raw.notes} />
                )}
              </div>
            </div>
          </Section>

          <Section title={t('admin.dmSectionPayment')}>
            {(() => {
              // grossManual = total sebelum diskon (harga manual kalau override,
              // harga otomatis kalau tidak).
              const grossManual = raw.priceSnapshot + raw.discount;
              const discountPct =
                raw.discount > 0
                  ? ((raw.discount / grossManual) * 100).toFixed(1)
                  : '0';
              const autoTotal = raw.autoCalculatedTotal;
              const diff = autoTotal !== null ? grossManual - autoTotal : null;
              const hasBreakdown = raw.isPriceOverride || raw.discount > 0;

              return (
                <div className="border-border overflow-hidden rounded-[10px] border">
                  <div className="space-y-1.5 bg-cream-50 px-3.5 py-3">
                    {/* Override manual — dibikin menonjol biar Owner gampang
                        nangkep kalau nominalnya bukan hitungan sistem. */}
                    {raw.isPriceOverride && autoTotal !== null && (
                      <>
                        <PayRow label="Harga otomatis sistem" value={formatIDR(autoTotal)} />
                        <PayRow
                          label="Diubah manual oleh admin"
                          value={formatIDR(grossManual)}
                          className="font-medium text-amber-700"
                        />
                        {diff !== null && diff !== 0 && (
                          <div className="text-right text-[11.5px] text-amber-600">
                            selisih {diff > 0 ? '+' : ''}
                            {formatIDR(diff)} dari harga sistem
                          </div>
                        )}
                      </>
                    )}
                    {raw.isPriceOverride && autoTotal === null && (
                      <PayRow
                        label="Harga diubah manual oleh admin"
                        value={formatIDR(grossManual)}
                        className="font-medium text-amber-700"
                      />
                    )}
                    {raw.discount > 0 && (
                      <>
                        {!raw.isPriceOverride && (
                          <PayRow
                            label={t('admin.subtotalBeforeDiscount')}
                            value={formatIDR(grossManual)}
                          />
                        )}
                        <PayRow
                          label={`Diskon (${discountPct}%)`}
                          value={`-${formatIDR(raw.discount)}`}
                          className="text-green-700"
                        />
                      </>
                    )}
                    <div
                      className={cn(
                        'flex items-center justify-between text-[15px] font-bold text-[#2f6b41]',
                        hasBreakdown && 'border-border mt-1 border-t pt-2',
                      )}
                    >
                      <span>{t('admin.tTotal')}</span>
                      <span>{formatIDR(booking.total)}</span>
                    </div>
                  </div>

                  {/* Status pelunasan dipisah ke baris bawah — beda konsep dari
                      rincian harga di atas (yang ini uang yang sudah masuk). */}
                  <div className="border-border flex items-center justify-between border-t px-3.5 py-2.5">
                    <span className="text-muted text-[12.5px]">
                      {t('admin.dmPaidTotal')}
                    </span>
                    <div className="text-right">
                      <div
                        className={cn(
                          'text-[13.5px] font-semibold',
                          raw.paidTotal >= booking.total
                            ? 'text-[#2f6b41]'
                            : 'text-[#c8952e]',
                        )}
                      >
                        {formatIDR(raw.paidTotal)}
                      </div>
                      {outstanding > 0 && (
                        <div className="text-[11.5px] text-[#c8952e]">
                          sisa {formatIDR(outstanding)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Section>

          {/* Riwayat edit — timeline, terbaru di atas */}
          {raw.editLogs.length > 0 && (
            <Section title="Riwayat Edit">
              <div className="flex flex-col">
                {raw.editLogs.map((log, i) => (
                  <div
                    key={log.id}
                    className={cn(
                      'relative pl-5',
                      i < raw.editLogs.length - 1 && 'pb-4',
                    )}
                  >
                    {/* Rel vertikal penghubung antar entri */}
                    {i < raw.editLogs.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute top-3.5 bottom-0 left-[3.5px] w-px bg-stone-200"
                      />
                    )}
                    <span
                      aria-hidden
                      className="absolute top-1.5 left-0 h-2 w-2 rounded-full bg-stone-300 ring-3 ring-white"
                    />
                    <div className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-stone-500">
                      <span className="font-semibold text-stone-700">
                        {log.editedByName}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(log.editedAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-stone-600 italic">
                      &ldquo;{log.note}&rdquo;
                    </p>
                    <div className="mt-1.5 flex flex-col gap-1">
                      {Object.entries(log.changes).map(([field, { from, to }]) => (
                        <div
                          key={field}
                          className="flex flex-wrap items-baseline gap-x-1.5 text-[12px]"
                        >
                          <span className="text-muted font-medium">
                            {editFieldLabel(field)}
                          </span>
                          <span className="text-stone-400 line-through">
                            {editFieldValue(field, from, roomNames)}
                          </span>
                          <ArrowRight
                            size={11}
                            strokeWidth={2.2}
                            aria-hidden
                            className="shrink-0 text-stone-400"
                          />
                          <span className="font-semibold text-stone-700">
                            {editFieldValue(field, to, roomNames)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Aksi (nempel di bawah) ─────────────────────────────── */}
        <div className="border-border bg-cream-50 border-t px-5 py-3.5 sm:px-6">
          {autoNote && (
            <p className="text-muted mb-2.5 text-[12px]">{autoNote}</p>
          )}
          {error && <p className="mb-2.5 text-[13px] text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {status === 'DP' && (
              <ActionButton
                icon={<CircleCheckBig size={15} strokeWidth={2} aria-hidden />}
                onClick={() => runUpdate(onMarkLunas)}
                disabled={updating}
              >
                {updating ? t('admin.saving') : t('admin.dmMarkLunas')}
              </ActionButton>
            )}
            {status === 'LUNAS' && (
              <ActionButton
                icon={<LogIn size={15} strokeWidth={2} aria-hidden />}
                onClick={() => runUpdate(onMarkCheckedIn)}
                disabled={updating}
              >
                {updating ? t('admin.saving') : t('admin.dmMarkCheckedIn')}
              </ActionButton>
            )}
            {status === 'CHECKED_IN' && (
              <ActionButton
                icon={<CheckCheck size={15} strokeWidth={2} aria-hidden />}
                onClick={() => runUpdate(onMarkCompleted)}
                disabled={updating}
              >
                {updating ? t('admin.saving') : t('admin.dmMarkCompleted')}
              </ActionButton>
            )}
            {status === 'DP' && (
              <ActionButton
                variant="outline"
                icon={<Ban size={15} strokeWidth={2} aria-hidden />}
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => runUpdate(onMarkHangus)}
                disabled={updating}
              >
                {updating ? t('admin.saving') : t('admin.dmMarkHangus')}
              </ActionButton>
            )}
            {status === 'LUNAS' && (
              <ActionButton
                variant="outline"
                icon={<UserX size={15} strokeWidth={2} aria-hidden />}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => runUpdate(onMarkNoShow)}
                disabled={updating}
              >
                {updating ? t('admin.saving') : t('admin.dmMarkNoShow')}
              </ActionButton>
            )}
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <ActionButton
                variant="outline"
                icon={<MessageCircle size={15} strokeWidth={2} aria-hidden />}
              >
                {t('admin.dmContactWa')}
              </ActionButton>
            </a>
            <ActionButton
              variant="outline"
              icon={<Pencil size={14} strokeWidth={2} aria-hidden />}
              className="border-stone-200 text-stone-600 hover:bg-stone-100"
              onClick={() => {
                onClose();
                router.push(`/admin/penginapan/booking/${booking.kode}/edit`);
              }}
              disabled={updating}
            >
              Edit
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

const EDIT_FIELD_LABELS: Record<string, string> = {
  guestName: 'Nama Tamu',
  guestPhone: 'No. WhatsApp',
  notes: 'Catatan',
  priceSnapshot: 'Total Harga',
  discount: 'Diskon',
  isPriceOverride: 'Override Manual',
  checkIn: 'Tanggal Check-in',
  checkOut: 'Tanggal Check-out',
  rooms: 'Kamar',
  autoCalculatedTotal: 'Harga Otomatis',
};

function editFieldLabel(field: string): string {
  return EDIT_FIELD_LABELS[field] ?? field;
}

function editFieldValue(field: string, value: unknown, roomNames: Record<string, string>): string {
  if (field === 'priceSnapshot' || field === 'discount' || field === 'autoCalculatedTotal') {
    return formatIDR(Number(value));
  }
  if (field === 'isPriceOverride') return value ? 'Ya' : 'Tidak';
  if (field === 'checkIn' || field === 'checkOut') return formatDate(String(value));
  if (value === null || value === undefined || value === '') return '(kosong)';
  // Backend nyimpen daftar kamar sebagai slug ("royal-kahuripan, camp-jamuju")
  // — diterjemahin ke nama tampilan pas dibaca, bukan pas disimpan, biar log
  // lama ikut kebaca rapi juga.
  if (field === 'rooms') {
    return String(value)
      .split(',')
      .map((slug) => roomNames[slug.trim()] ?? slug.trim())
      .join(', ');
  }
  return String(value);
}

/** Tombol aksi modal. Sengaja TIDAK nimpa radius — `--radius-lg/xl` di tema
 *  ini gede (12px/20px, ukuran kartu), jadi kalau dipakai di tombol setinggi
 *  36px hasilnya kelihatan kayak kapsul. Biarin ikut `rounded-[8px]` bawaan
 *  `Button`. */
function ActionButton({
  icon,
  variant,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { icon?: React.ReactNode }) {
  return (
    <Button
      size="sm"
      variant={variant}
      className={cn('px-3.5 text-[13px]', className)}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );
}

function PayRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between text-[13px] text-stone-500',
        className,
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
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
    <div className="min-w-0">
      <div className="text-muted text-xs">{label}</div>
      <div className={cn('font-semibold break-words', valueClass)}>{value}</div>
    </div>
  );
}
