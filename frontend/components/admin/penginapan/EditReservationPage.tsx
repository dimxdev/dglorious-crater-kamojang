'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, Input, RupiahInput } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  editReservation,
  fetchAdminReservationByCode,
  type AdminReservationDetail,
  type EditReservationItemInput,
} from '@/lib/api/reservations';
import {
  checkRoomTypeAvailability,
  fetchAdminRoomTypes,
  toBookableRoom,
} from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { calcGroupsTotal, calcNightsBreakdown, type BookableRoom } from '@/lib/pricing';
import { addDaysStr, todayWib } from '@/lib/dateWib';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { isInvalidPhone, normalizeIdPhone } from '@/lib/phone';
import {
  capacityErrors,
  editReasonError,
  errorMessage,
  guestNameError,
  LIMITS,
  notesError,
  stayRangeError,
} from '@/lib/validation';
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
import { StatusBadge } from './StatusBadge';
import { displayStatus, toDisplay } from './ReservationDetailModal';

export function EditReservationPage({ code }: { code: string }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<BookableRoom[]>([]);

  // Reservasi asli — diambil sekali saat mount
  const [reservation, setReservation] = useState<AdminReservationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state — diisi setelah reservasi dimuat
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [manualAmount, setManualAmount] = useState<number | null>(null);
  const [discountMode, setDiscountMode] = useState<DiscountMode>('amount');
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [editNote, setEditNote] = useState('');

  const [roomTypeIdBySlug, setRoomTypeIdBySlug] = useState<Record<string, number>>({});
  // Lihat catatan di ReservationFormPage: "loading" diturunkan saat render.
  const [availabilityResult, setAvailabilityResult] = useState<{
    key: string;
    bySlug: Record<string, SlugAvailability>;
  }>({ key: '', bySlug: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load reservasi + room type map
  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchAdminReservationByCode(token, code),
      fetchAdminRoomTypes(token),
    ])
      .then(([b, rtList]) => {
        setReservation(b);
        setRooms(rtList.map(toBookableRoom));
        setRoomTypeIdBySlug(Object.fromEntries(rtList.map((r) => [r.slug, r.id])));

        // Pre-fill form dari data reservasi
        setName(b.guestName);
        setPhone(b.guestPhone);
        setCheckIn(b.checkIn.slice(0, 10));
        setCheckOut(b.checkOut.slice(0, 10));
        setNotes(b.notes ?? '');

        // Map items → RoomGroup[]
        setRoomGroups(
          b.items.map((item) => ({
            slug: item.roomTypeSlug,
            adults: item.adults,
            children: item.children,
            extraBedQty: item.extraBedQty,
            extraBedType: item.extraBedType === 'WITHOUT_BED' ? 'without' : 'with',
          })),
        );

        // Harga: kalau ada override, pre-fill manual amount dengan gross sebelum diskon
        if (b.isPriceOverride) {
          setManualAmount(b.priceSnapshot + b.discount);
        }

        // Diskon
        if (b.discount > 0) {
          setDiscountMode('amount');
          setDiscountAmount(b.discount);
        }
      })
      .catch((e) => {
        setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat data reservasi');
      });
  }, [token, code]);

  // Availability check saat tanggal / kamar berubah
  const slugsKey = [...new Set(roomGroups.map((g) => g.slug))].sort().join(',');
  const availabilityActive =
    !!token && !!reservation && !!checkIn && !!checkOut && checkIn < checkOut;
  const availabilityKey = availabilityActive
    ? `${reservation?.id}|${checkIn}|${checkOut}|${slugsKey}|${JSON.stringify(roomTypeIdBySlug)}`
    : '';
  const availabilityBySlug: Record<string, SlugAvailability> = (() => {
    if (!availabilityActive || availabilityResult.key === availabilityKey) {
      return availabilityResult.bySlug;
    }
    const next: Record<string, SlugAvailability> = { ...availabilityResult.bySlug };
    roomGroups.forEach((g) => {
      next[g.slug] = { state: 'loading' };
    });
    return next;
  })();
  useEffect(() => {
    if (!availabilityActive || !token || !reservation) return;
    const slugs = [...new Set(roomGroups.map((g) => g.slug))];
    const setSlug = (slug: string, value: SlugAvailability) =>
      setAvailabilityResult((prev) => ({
        key: availabilityKey,
        bySlug: {
          ...(prev.key === availabilityKey ? prev.bySlug : {}),
          [slug]: value,
        },
      }));

    let cancelled = false;
    const timer = setTimeout(async () => {
      await Promise.all(
        slugs.map(async (slug) => {
          const id = roomTypeIdBySlug[slug];
          if (!id) return;
          try {
            const result = await checkRoomTypeAvailability(
              token, id, checkIn, checkOut, reservation.id,
            );
            if (!cancelled)
              setSlug(
                slug,
                result.isAvailable
                  ? { state: 'ok', availableUnits: result.availableUnits, totalUnits: result.totalUnits }
                  : { state: 'full' },
              );
          } catch {
            if (!cancelled)
              setSlug(slug, { state: 'error' });
          }
        }),
      );
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityKey]);

  const minCheckOut = checkIn ? addDaysStr(checkIn, 1) : '';

  // Check-in tidak boleh sebelum hari ini (WIB), kecuali nilainya tidak diubah
  // dari data tersimpan — reservasi lama (mis. COMPLETED) tetap bisa diedit.
  const today = todayWib();
  const originalCheckIn = reservation ? reservation.checkIn.slice(0, 10) : '';
  const minCheckIn = originalCheckIn && originalCheckIn < today ? originalCheckIn : today;
  const checkInPast = checkIn !== '' && checkIn !== originalCheckIn && checkIn < today;
  // S&K poin 6: reschedule paling lambat 7 hari sebelum check-in semula; memajukan
  // check-in ke hari ini (tamu datang lebih awal) dikecualikan. Backend juga menolak.
  const daysToOriginal = originalCheckIn
    ? Math.round((Date.parse(`${originalCheckIn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
    : 99;
  const rescheduleClosed = daysToOriginal < 7;
  const rescheduleBlocked =
    rescheduleClosed && checkIn !== '' && checkIn !== originalCheckIn && checkIn !== today;
  // Tamu sudah datang: tanggal check-in tidak boleh digeser (backend juga menolak).
  const checkInLocked = reservation?.status === 'CHECKED_IN' || reservation?.status === 'COMPLETED';

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    if (val && val >= checkOut) {
      setCheckOut(addDaysStr(val, 1));
    }
  }

  const autoTotal = calcGroupsTotal(rooms, roomGroups, checkIn, checkOut);
  const grossTotal = manualAmount ?? autoTotal;
  const discount = resolveDiscountAmount(discountMode, discountAmount, discountPercent, grossTotal);
  const total = Math.max(0, grossTotal - discount);
  const { weekdayNights, weekendNights } = calcNightsBreakdown(checkIn, checkOut);

  function hasChanges(): boolean {
    if (!reservation) return false;
    if (name.trim() !== reservation.guestName) return true;
    if ((phoneNormalized ?? phone.trim()) !== (normalizeIdPhone(reservation.guestPhone) ?? reservation.guestPhone)) return true;
    if ((notes.trim() || '') !== (reservation.notes ?? '')) return true;
    if (checkIn !== reservation.checkIn.slice(0, 10)) return true;
    if (checkOut !== reservation.checkOut.slice(0, 10)) return true;

    // Rooms
    if (roomGroups.length !== reservation.items.length) return true;
    for (let i = 0; i < roomGroups.length; i++) {
      const g = roomGroups[i];
      const orig = reservation.items[i];
      if (g.slug !== orig.roomTypeSlug) return true;
      if (g.adults !== orig.adults) return true;
      if (g.children !== orig.children) return true;
      if (g.extraBedQty !== orig.extraBedQty) return true;
    }

    // Harga manual
    const origGross = reservation.isPriceOverride
      ? reservation.priceSnapshot + reservation.discount
      : null;
    if (manualAmount !== origGross) return true;

    // Diskon
    if (discount !== reservation.discount) return true;

    return false;
  }

  const phoneInvalid = isInvalidPhone(phone);
  const phoneNormalized = normalizeIdPhone(phone);
  const capErrors = capacityErrors(roomGroups, rooms, t);
  const stayErr = stayRangeError(checkIn, checkOut, t);
  const nameErr = guestNameError(name, t);
  const notesErr = notesError(notes, t);
  const reasonErr = editReasonError(editNote, t);
  const manualInvalid = manualAmount !== null && manualAmount < 1;
  const validationError: string | null =
    (nameErr ? (name.trim() ? nameErr : t('admin.reservationIncomplete')) : null) ??
    (!phone.trim() ? t('admin.reservationIncomplete') : null) ??
    (phoneInvalid ? t('admin.invalidPhone') : null) ??
    notesErr ??
    (checkInPast ? t('admin.checkInPast') : null) ??
    (rescheduleBlocked ? t('admin.rescheduleTooLate') : null) ??
    stayErr ??
    (roomGroups.length === 0 ? t('admin.reservationIncomplete') : null) ??
    capErrors.find((m) => m) ??
    (manualInvalid ? t('validation.manualMin') : null) ??
    (grossTotal > LIMITS.maxRupiah ? t('validation.totalTooLarge') : null) ??
    (discount > grossTotal ? t('admin.discountTooLarge') : null) ??
    (!hasChanges() ? t('validation.noChanges') : null) ??
    reasonErr ??
    null;

  async function handleSave() {
    if (!reservation) return;
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const items: EditReservationItemInput[] = roomGroups.map((g) => ({
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

      await editReservation(token!, code, {
        guestName: name.trim(),
        guestPhone: phoneNormalized ?? phone.trim(),
        checkIn,
        checkOut,
        notes: notes.trim() || undefined,
        items,
        priceOverride: manualAmount !== null ? manualAmount : undefined,
        discount: discount || undefined,
        note: editNote.trim(),
      });

      router.push('/admin/penginapan/reservasi');
    } catch (e) {
      setError(errorMessage(e, t('admin.saveError')));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <DashboardLayout title="Edit Reservasi">
        <Card>
          <CardContent className="p-5 sm:p-7">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              onClick={() => router.back()}
              className="text-forest-700 mt-2 text-sm font-semibold underline"
            >
              Kembali
            </button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!reservation) {
    return (
      <DashboardLayout title="Edit Reservasi">
        <Card>
          <CardContent className="text-muted p-5 text-center text-sm sm:p-7">
            Memuat data...
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const displayed = toDisplay(reservation);
  const status = displayStatus(displayed);

  return (
    <DashboardLayout title={`Edit Reservasi ${code}`}>
      <Card>
        <CardContent className="p-5 sm:p-7">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <span className="text-forest-700 font-serif text-xl font-extrabold">{code}</span>
            <StatusBadge status={status} />
            <span className="text-muted text-[12px]">
              {reservation.channel === 'LANGSUNG' ? 'Langsung' : 'Reservasi'}
            </span>
          </div>
          <p className="text-muted mt-0.5 text-[12.5px]">
            Semua perubahan akan dicatat di riwayat edit beserta alasannya.
          </p>

          <div className="mt-5.5 grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label={`${t('admin.guestName')} *`}
              value={name}
              maxLength={LIMITS.guestName}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label={t('admin.guestPhone')}
              value={phone}
              inputMode="tel"
              maxLength={25}
              autoComplete="off"
              error={phoneInvalid ? t('admin.invalidPhone') : undefined}
              hint={phoneNormalized ? t('validation.phoneSavedAs', { phone: phoneNormalized }) : undefined}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label={t('admin.tCheckIn')}
              type="date"
              value={checkIn}
              min={minCheckIn}
              disabled={checkInLocked}
              error={checkInPast ? t('admin.checkInPast') : rescheduleBlocked ? t('admin.rescheduleTooLate') : undefined}
              onChange={(e) => handleCheckInChange(e.target.value)}
            />
            <Input
              label={t('admin.tCheckOut')}
              type="date"
              value={checkOut}
              min={minCheckOut}
              max={checkIn ? addDaysStr(checkIn, LIMITS.maxNights) : undefined}
              error={stayErr ?? undefined}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
          {!checkInLocked && rescheduleClosed && (
            <p className="text-muted mt-2 text-[12px]">{t('admin.rescheduleClosedNote')}</p>
          )}
          {checkInLocked && (
            <p className="text-muted mt-2 text-[12px]">{t('admin.checkInLockedArrived')}</p>
          )}
          {(weekdayNights > 0 || weekendNights > 0) && (
            <p className="text-muted mt-2 text-[12px]">
              {t('admin.nightsBreakdown', { weekday: weekdayNights, weekend: weekendNights })}
            </p>
          )}

          <div className="mt-4.5">
            <label className="text-foreground text-sm font-medium">
              {t('admin.lodgingType')}
            </label>
            <div className="mt-1.5">
              <RoomGroupEditor
                value={roomGroups}
                onChange={setRoomGroups}
                rooms={rooms}
                checkIn={checkIn}
                checkOut={checkOut}
                availabilityBySlug={availabilityBySlug}
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
            </div>
          </div>

          <div className="mt-4.5 grid gap-4.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label={t('admin.notes')}
                placeholder={t('admin.notesPlaceholder')}
                value={notes}
                maxLength={LIMITS.notes}
                error={notesErr ?? undefined}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-muted mt-1 text-right text-[11.5px] tabular-nums">
                {notes.length}/{LIMITS.notes}
              </p>
            </div>
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

          {discount > 0 && (
            <div className="text-muted mt-4.5 flex items-center justify-between text-[12.5px]">
              <span>{t('admin.subtotalBeforeDiscount')}</span>
              <span>{formatIDR(grossTotal)}</span>
            </div>
          )}
          <div
            className={cn(
              'flex items-center justify-between rounded-[10px] bg-green-50 px-3.5 py-3',
              discount > 0 ? 'mt-1.5' : 'mt-4.5',
            )}
          >
            <span className="text-[13px] font-medium text-green-800">{t('admin.amount')}</span>
            <span className="text-lg font-bold text-green-700">{formatIDR(total)}</span>
          </div>
          {manualAmount === null ? (
            <button
              type="button"
              onClick={() => setManualAmount(autoTotal)}
              className="text-accent mt-2 text-[12px] font-semibold"
            >
              {t('admin.overrideAmount')}
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-2.5">
              <RupiahInput
                aria-label={t('admin.amount')}
                value={manualAmount}
                onValueChange={(n) => setManualAmount(n ?? 0)}
                error={manualInvalid ? t('validation.manualMin') : undefined}
                className="max-w-52"
              />
              <button
                type="button"
                onClick={() => setManualAmount(null)}
                className="text-accent text-[12px] font-semibold"
              >
                {t('admin.useAutoAmount')}
              </button>
            </div>
          )}
          <p className="text-muted mt-1 text-[12px]">{t('admin.amountOverrideHint')}</p>

          {/* Alasan edit — wajib */}
          <div className="mt-5 border-t border-dashed border-[#e2dccb] pt-5">
            <Input
              label="Alasan Edit *"
              placeholder="cth: koreksi nama, ganti tanggal karena reschedule, nego harga, ..."
              value={editNote}
              maxLength={LIMITS.editReason.max}
              onChange={(e) => setEditNote(e.target.value)}
            />
            <p className="text-muted mt-1 text-[12px]">
              Wajib diisi (3-300 karakter), tersimpan permanen di riwayat audit untuk transparansi Owner. ({editNote.trim().length}/{LIMITS.editReason.max})
            </p>
          </div>

          {(error ?? validationError) && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error ?? validationError}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} disabled={saving || !!validationError}>
              {saving ? t('admin.saving') : 'Simpan Perubahan'}
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => router.back()}>
              {t('admin.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
