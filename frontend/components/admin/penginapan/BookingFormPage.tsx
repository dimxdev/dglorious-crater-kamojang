'use client';

import { CircleCheckBig, Info, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, Input, Select } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  createBooking,
  type CreateBookingItemInput,
  type PaymentMethodInput,
} from '@/lib/api/bookings';
import {
  checkRoomTypeAvailability,
  fetchAdminRoomTypes,
} from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { localizeRooms } from '@/lib/data/rooms';
import { formatDate, formatIDR } from '@/lib/format';
import {
  calcGroupSubtotal,
  calcGroupsTotal,
  calcNightsBreakdown,
} from '@/lib/pricing';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import {
  DiscountField,
  resolveDiscountAmount,
  type DiscountMode,
} from './DiscountField';
import {
  RoomGroupEditor,
  type RoomGroup,
  type SlugAvailability,
} from './RoomGroupEditor';

const INITIAL_GROUP: RoomGroup = {
  slug: '',
  adults: 2,
  children: 0,
  extraBedQty: 0,
  extraBedType: 'with',
};

const PAY_METHOD_MAP: Record<string, PaymentMethodInput> = {
  cash: 'CASH',
  qris: 'QRIS',
  transfer: 'BANK_TRANSFER',
};

export type BookingFormChannel = 'WHATSAPP' | 'WALK_IN';

/**
 * Form pencatatan booking — dipakai bareng dua menu yang alurnya 95% sama:
 *
 * - `WHATSAPP` (§6.1): nego/DP/pelunasan terjadi di WhatsApp, admin cuma
 *   mencatat setelah clear. Tamu belum tiba → status awal DP atau LUNAS.
 * - `WALK_IN`: tamu sudah di lokasi & bayar penuh di tempat → langsung
 *   CHECKED_IN, jadi yang ditanya metode bayar, bukan status pembayaran.
 *
 * Dulu dua halaman terpisah dengan isi nyaris identik; disatukan biar
 * perbaikan (validasi, ringkasan harga, dll) otomatis kena dua-duanya.
 */
export function BookingFormPage({ channel }: { channel: BookingFormChannel }) {
  const { t, locale } = useTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const rooms = localizeRooms(locale);
  const isWalkIn = channel === 'WALK_IN';

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([
    { ...INITIAL_GROUP, slug: rooms[0]?.slug ?? '' },
  ]);
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [manualAmount, setManualAmount] = useState<number | null>(null);
  const [discountMode, setDiscountMode] = useState<DiscountMode>('amount');
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  // Walk-in: metode bayar. WhatsApp: status pembayaran + nominal DP.
  const [payMethod, setPayMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState<'DP' | 'LUNAS'>('DP');
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  const [roomTypeIdBySlug, setRoomTypeIdBySlug] = useState<Record<string, number>>({});
  const [availabilityBySlug, setAvailabilityBySlug] = useState<
    Record<string, SlugAvailability>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  // Mock rooms.ts dipakai buat dropdown/harga (slug-nya sama persis dengan
  // data asli), tapi backend butuh roomTypeId numerik — ambil pemetaannya
  // sekali dari API admin.
  useEffect(() => {
    if (!token) return;
    fetchAdminRoomTypes(token)
      .then((list) => {
        setRoomTypeIdBySlug(Object.fromEntries(list.map((r) => [r.slug, r.id])));
      })
      .catch(() => {
        // Diam-diam gagal — error baru muncul kalau admin coba Simpan.
      });
  }, [token]);

  const slugsKey = [...new Set(roomGroups.map((g) => g.slug))].sort().join(',');
  useEffect(() => {
    const ids = Object.keys(roomTypeIdBySlug);
    if (!token || !ids.length || !checkIn || !checkOut || checkIn >= checkOut) return;

    const slugs = [...new Set(roomGroups.map((g) => g.slug))];
    setAvailabilityBySlug((prev) => {
      const next = { ...prev };
      slugs.forEach((s) => {
        next[s] = { state: 'loading' };
      });
      return next;
    });

    let cancelled = false;
    const timer = setTimeout(async () => {
      await Promise.all(
        slugs.map(async (slug) => {
          const id = roomTypeIdBySlug[slug];
          if (!id) return;
          try {
            const result = await checkRoomTypeAvailability(token, id, checkIn, checkOut);
            if (!cancelled)
              setAvailabilityBySlug((prev) => ({
                ...prev,
                [slug]: result.isAvailable
                  ? {
                      state: 'ok',
                      availableUnits: result.availableUnits,
                      totalUnits: result.totalUnits,
                    }
                  : { state: 'full' },
              }));
          } catch {
            if (!cancelled)
              setAvailabilityBySlug((prev) => ({ ...prev, [slug]: { state: 'error' } }));
          }
        }),
      );
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, checkIn, checkOut, slugsKey, roomTypeIdBySlug]);

  const minCheckOut = new Date(new Date(checkIn).getTime() + 86400000)
    .toISOString()
    .slice(0, 10);

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    if (val >= checkOut) {
      setCheckOut(new Date(new Date(val).getTime() + 86400000).toISOString().slice(0, 10));
    }
  }

  const autoTotal = calcGroupsTotal(rooms, roomGroups, checkIn, checkOut);
  const grossTotal = manualAmount ?? autoTotal;
  const discount = resolveDiscountAmount(
    discountMode,
    discountAmount,
    discountPercent,
    grossTotal,
  );
  const total = Math.max(0, grossTotal - discount);
  const { weekdayNights, weekendNights } = calcNightsBreakdown(checkIn, checkOut);
  const nights = weekdayNights + weekendNights;

  // Nominal yang benar-benar masuk sekarang: walk-in selalu penuh, WhatsApp
  // tergantung status (LUNAS = penuh, DP = sesuai isian admin).
  const paidNow = isWalkIn ? total : paymentStatus === 'LUNAS' ? total : (paidAmount ?? 0);
  const remaining = Math.max(0, total - paidNow);

  // Tenda yang penuh dicegat di sini biar admin gak submit dulu baru ditolak
  // server. `otherSameSlugs` samain logikanya dengan RoomGroupEditor: satu
  // slug dipilih dua kali = butuh dua unit.
  const unavailableSlug = roomGroups.some((g, i) => {
    const avail = availabilityBySlug[g.slug];
    if (!avail) return false;
    if (avail.state === 'full') return true;
    if (avail.state !== 'ok') return false;
    const otherSameSlugs = roomGroups.filter((o, j) => j !== i && o.slug === g.slug).length;
    return avail.availableUnits - otherSameSlugs <= 0;
  });

  function resetForm() {
    setName('');
    setPhone('');
    setNotes('');
    setCheckIn(today);
    setCheckOut(tomorrow);
    setPayMethod('cash');
    setPaymentStatus('DP');
    setPaidAmount(null);
    setManualAmount(null);
    setDiscountMode('amount');
    setDiscountAmount(null);
    setDiscountPercent(null);
    setRoomGroups([{ ...INITIAL_GROUP, slug: rooms[0]?.slug ?? '' }]);
    setError(null);
  }

  async function handleSave() {
    setError(null);

    if (!name.trim() || !phone.trim() || roomGroups.length === 0) {
      setError(t('admin.bookingIncomplete'));
      return;
    }
    if (unavailableSlug) {
      setError(t('admin.roomUnavailable'));
      return;
    }
    if (discount > grossTotal) {
      setError(t('admin.discountTooLarge'));
      return;
    }
    if (!isWalkIn && paymentStatus === 'DP' && (paidAmount === null || paidAmount <= 0)) {
      setError(t('admin.paidAmountRequired'));
      return;
    }

    setSaving(true);
    try {
      const items: CreateBookingItemInput[] = roomGroups.map((g) => ({
        roomTypeId: roomTypeIdBySlug[g.slug],
        adults: g.adults,
        children: g.children,
        extraBedQty: g.extraBedQty,
        extraBedType:
          g.extraBedQty > 0
            ? g.extraBedType === 'with'
              ? 'WITH_BED'
              : 'WITHOUT_BED'
            : undefined,
      }));

      const created = await createBooking(token!, {
        guestName: name.trim(),
        guestPhone: phone.trim(),
        checkIn,
        checkOut,
        bookingChannel: channel,
        notes: notes.trim() || undefined,
        isPriceOverride: manualAmount !== null,
        manualTotal: manualAmount ?? undefined,
        discount: discount || undefined,
        items,
        ...(isWalkIn
          ? { payMethod: PAY_METHOD_MAP[payMethod] }
          : {
              initialStatus: paymentStatus,
              paidAmount: paymentStatus === 'DP' ? (paidAmount ?? undefined) : undefined,
            }),
      });

      setSavedCode(created.bookingCode);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const pageTitle = isWalkIn ? t('dashboard.walkin') : t('dashboard.bookingWhatsapp');

  // ── Layar sukses ────────────────────────────────────────────────────
  // Dulu cuma satu baris teks hijau lalu form dikosongkan diam-diam — kode
  // booking-nya gampang kelewat. Sekarang jadi layar tersendiri.
  if (savedCode) {
    return (
      <DashboardLayout title={pageTitle}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center p-7 text-center sm:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CircleCheckBig size={26} strokeWidth={1.8} className="text-green-700" aria-hidden />
            </div>
            <h2 className="mt-4 font-serif text-xl font-bold">
              {t('admin.successTitle')}
            </h2>
            <p className="text-muted mt-1 text-[13px]">{t('admin.successSub')}</p>

            <div className="border-border mt-5 w-full rounded-xl border bg-cream-50 px-4 py-4">
              <div className="text-muted text-[11px] font-semibold tracking-[0.06em] uppercase">
                {t('admin.tCode')}
              </div>
              <div className="text-forest-700 mt-0.5 font-serif text-2xl font-extrabold">
                {savedCode}
              </div>
              <div className="border-border mt-3 flex items-center justify-between border-t pt-3 text-[13px]">
                <span className="text-muted">{name}</span>
                <span className="font-semibold">{formatIDR(total)}</span>
              </div>
              <div className="text-muted mt-1 flex items-center justify-between text-[12px]">
                <span>
                  {formatDate(checkIn)} → {formatDate(checkOut)}
                </span>
                <span>{t('admin.summaryNights', { nights })}</span>
              </div>
            </div>

            <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => router.push('/admin/penginapan/booking')}
              >
                {t('admin.successViewList')}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForm();
                  setSavedCode(null);
                }}
              >
                {t('admin.successAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title={pageTitle}>
      {/* Dua kolom di layar lebar: form di kiri, ringkasan harga nempel di
          kanan biar nominalnya selalu kelihatan sambil ngisi. Di layar sempit
          ringkasan turun ke bawah form (urutan alami: isi → cek → simpan). */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-serif text-[17px] font-bold">
                {isWalkIn ? t('admin.walkinTitle') : t('admin.waBookingTitle')}
              </h2>
              <p className="text-muted mt-1 text-[13px]">
                {isWalkIn ? t('admin.walkinSubtitle') : t('admin.waBookingSubtitle')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-6 p-5 sm:p-6">
              <Step n={1} title={t('admin.stepGuest')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={`${t('admin.guestName')} *`}
                    name="name"
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                  />
                  <Input
                    label={`${t('admin.guestPhone')} *`}
                    name="phone"
                    placeholder="08xx"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </Step>

              <Step n={2} title={t('admin.stepStay')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('admin.tCheckIn')}
                    type="date"
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                  />
                  <Input
                    label={t('admin.tCheckOut')}
                    type="date"
                    value={checkOut}
                    min={minCheckOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
                {nights > 0 && (
                  <p className="text-muted mt-2 text-[12px]">
                    {t('admin.nightsBreakdown', {
                      weekday: weekdayNights,
                      weekend: weekendNights,
                    })}
                  </p>
                )}
              </Step>

              <Step n={3} title={t('admin.stepRooms')}>
                {/* `hideTotal`: totalnya sudah ada di panel ringkasan — dulu
                    muncul dua kali di halaman yang sama. */}
                <RoomGroupEditor
                  value={roomGroups}
                  onChange={setRoomGroups}
                  rooms={rooms}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  availabilityBySlug={availabilityBySlug}
                  hideTotal
                  labels={{
                    roomLabel: t('admin.roomTypeLabel'),
                    adultsLabel: t('admin.adults'),
                    childrenLabel: t('admin.children'),
                    extraBedQtyLabel: t('admin.extraBedQty'),
                    subtotalLabel: t('admin.groupSubtotal'),
                    totalLabel: t('admin.groupGrandTotal'),
                    addLabel: t('admin.addRoomGroup'),
                  }}
                />
                <p className="text-muted mt-2 text-[12px]">
                  {t('admin.childrenRuleHint')}
                </p>
              </Step>

              <Step n={4} title={t('admin.stepPayment')}>
                <div className="flex flex-col gap-4">
                  <Input
                    label={t('admin.notes')}
                    name="notes"
                    placeholder={t('admin.notesPlaceholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {isWalkIn ? (
                      <Select
                        label={t('admin.payMethod')}
                        name="payMethod"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        options={[
                          { value: 'cash', label: t('admin.payCash') },
                          { value: 'qris', label: t('admin.payQris') },
                          { value: 'transfer', label: t('admin.payTransfer') },
                        ]}
                      />
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Select
                          label={t('admin.paymentStatus')}
                          name="paymentStatus"
                          value={paymentStatus}
                          onChange={(e) =>
                            setPaymentStatus(e.target.value as 'DP' | 'LUNAS')
                          }
                          options={[
                            { value: 'DP', label: t('admin.dp') },
                            { value: 'LUNAS', label: t('admin.lunas') },
                          ]}
                        />
                        {paymentStatus === 'DP' && (
                          <div>
                            <Input
                              label={t('admin.paidAmount')}
                              name="paidAmount"
                              type="text"
                              inputMode="numeric"
                              value={
                                paidAmount != null
                                  ? paidAmount.toLocaleString('id-ID')
                                  : ''
                              }
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                setPaidAmount(raw === '' ? null : Number(raw));
                                setError(null);
                              }}
                            />
                            <p className="text-muted mt-1 text-[12px]">
                              {t('admin.paidAmountHint')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <DiscountField
                      mode={discountMode}
                      onModeChange={setDiscountMode}
                      amount={discountAmount}
                      onAmountChange={setDiscountAmount}
                      percent={discountPercent}
                      onPercentChange={setDiscountPercent}
                      grossTotal={grossTotal}
                    />
                  </div>
                </div>
              </Step>

              {isWalkIn && (
                <div className="flex items-start gap-2 rounded-[10px] bg-green-50 px-3.5 py-3 text-[12.5px] font-medium text-green-800">
                  <Info size={15} strokeWidth={1.9} className="mt-px shrink-0" aria-hidden />
                  {t('admin.walkinCheckinNote')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Panel ringkasan ─────────────────────────────────────────── */}
        <div className="w-full lg:sticky lg:top-4 lg:w-80 lg:shrink-0">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-muted text-[11px] font-semibold tracking-[0.06em] uppercase">
                {t('admin.summaryTitle')}
              </h3>

              {nights > 0 && (
                <div className="border-border mt-3 rounded-[10px] border bg-cream-50 px-3 py-2.5 text-[12.5px]">
                  <div className="font-semibold">
                    {formatDate(checkIn)} → {formatDate(checkOut)}
                  </div>
                  <div className="text-muted mt-0.5">
                    {t('admin.summaryNights', { nights })}
                  </div>
                </div>
              )}

              {/* Rincian per tenda — sebelumnya cuma ada subtotal di dalam
                  kartu masing-masing, gak pernah kelihatan berbarengan. */}
              <div className="mt-3 flex flex-col gap-2">
                {roomGroups.map((g, i) => {
                  const room = rooms.find((r) => r.slug === g.slug);
                  const subtotal = calcGroupSubtotal(room, g, checkIn, checkOut);
                  return (
                    <div key={i} className="flex items-baseline justify-between gap-2 text-[12.5px]">
                      <div className="min-w-0">
                        <div className="truncate">{room?.name ?? '—'}</div>
                        {g.extraBedQty > 0 && (
                          <div className="text-muted text-[11.5px]">
                            {t('admin.summaryExtraBed', { qty: g.extraBedQty })}
                          </div>
                        )}
                      </div>
                      <span className="text-muted shrink-0 tabular-nums">
                        {formatIDR(subtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {nights > 0 && (
                <div className="border-border mt-3 flex flex-col gap-1.5 border-t pt-3">
                  {(discount > 0 || manualAmount !== null) && (
                    <SumRow
                      label={t('admin.subtotalBeforeDiscount')}
                      value={formatIDR(grossTotal)}
                    />
                  )}
                  {discount > 0 && (
                    <SumRow
                      label={t('admin.discount')}
                      value={`-${formatIDR(discount)}`}
                      className="text-green-700"
                    />
                  )}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-[13px] font-semibold">
                      {t('admin.amount')}
                    </span>
                    <span className="text-lg font-bold text-green-700 tabular-nums">
                      {formatIDR(total)}
                    </span>
                  </div>
                  {remaining > 0 && (
                    <div className="mt-0.5 flex items-baseline justify-between text-[12px] text-[#c8952e]">
                      <span>{t('admin.summaryRemaining')}</span>
                      <span className="tabular-nums">{formatIDR(remaining)}</span>
                    </div>
                  )}
                </div>
              )}

              {nights === 0 && (
                <p className="text-muted mt-3 text-[12.5px]">
                  {t('admin.summaryEmpty')}
                </p>
              )}

              {/* Override nominal — dipindah ke sini biar nempel sama angka
                  yang diubah, bukan kejauhan di bawah form. */}
              {manualAmount === null ? (
                <button
                  type="button"
                  onClick={() => setManualAmount(autoTotal)}
                  className="text-accent mt-2.5 text-[12px] font-semibold"
                >
                  {t('admin.overrideAmount')}
                </button>
              ) : (
                <div className="mt-2.5">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={manualAmount.toLocaleString('id-ID')}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setManualAmount(raw === '' ? 0 : Number(raw));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setManualAmount(null)}
                    className="text-accent mt-1.5 text-[12px] font-semibold"
                  >
                    {t('admin.useAutoAmount')}
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-3 text-[12.5px] font-medium text-red-600">{error}</p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={handleSave} disabled={saving} fullWidth>
                  {saving
                    ? t('admin.saving')
                    : isWalkIn
                      ? t('admin.saveCheckin')
                      : t('admin.saveConfirm')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={resetForm}
                  fullWidth
                >
                  <RotateCcw size={14} strokeWidth={2} aria-hidden />
                  {t('admin.resetForm')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

/** Judul bernomor — bikin form panjang kebaca sebagai beberapa tahap. */
function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="bg-forest-700 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
          {n}
        </span>
        <span className="text-[13.5px] font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

function SumRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('text-muted flex items-baseline justify-between text-[12.5px]', className)}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
