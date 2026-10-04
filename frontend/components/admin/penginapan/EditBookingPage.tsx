'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  editBooking,
  fetchAdminBookingByCode,
  type AdminBookingDetail,
  type EditBookingItemInput,
} from '@/lib/api/bookings';
import {
  checkRoomTypeAvailability,
  fetchAdminRoomTypes,
  toBookableRoom,
} from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { calcGroupsTotal, calcNightsBreakdown, type BookableRoom } from '@/lib/pricing';
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
import { StatusBadge } from './StatusBadge';
import { displayStatus, toDisplay } from './BookingDetailModal';

export function EditBookingPage({ code }: { code: string }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<BookableRoom[]>([]);

  // Booking asli — diambil sekali saat mount
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state — diisi setelah booking dimuat
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
  const [availabilityBySlug, setAvailabilityBySlug] = useState<Record<string, SlugAvailability>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load booking + room type map
  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchAdminBookingByCode(token, code),
      fetchAdminRoomTypes(token),
    ])
      .then(([b, rtList]) => {
        setBooking(b);
        setRooms(rtList.map(toBookableRoom));
        setRoomTypeIdBySlug(Object.fromEntries(rtList.map((r) => [r.slug, r.id])));

        // Pre-fill form dari data booking
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
        setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat data booking');
      });
  }, [token, code]);

  // Availability check saat tanggal / kamar berubah
  const slugsKey = [...new Set(roomGroups.map((g) => g.slug))].sort().join(',');
  useEffect(() => {
    if (!token || !booking || !checkIn || !checkOut || checkIn >= checkOut) return;
    const slugs = [...new Set(roomGroups.map((g) => g.slug))];
    setAvailabilityBySlug((prev) => {
      const next = { ...prev };
      slugs.forEach((s) => { next[s] = { state: 'loading' }; });
      return next;
    });

    let cancelled = false;
    const timer = setTimeout(async () => {
      await Promise.all(
        slugs.map(async (slug) => {
          const id = roomTypeIdBySlug[slug];
          if (!id) return;
          try {
            const result = await checkRoomTypeAvailability(
              token, id, checkIn, checkOut, booking.id,
            );
            if (!cancelled)
              setAvailabilityBySlug((prev) => ({
                ...prev,
                [slug]: result.isAvailable
                  ? { state: 'ok', availableUnits: result.availableUnits, totalUnits: result.totalUnits }
                  : { state: 'full' },
              }));
          } catch {
            if (!cancelled)
              setAvailabilityBySlug((prev) => ({ ...prev, [slug]: { state: 'error' } }));
          }
        }),
      );
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, checkIn, checkOut, slugsKey, roomTypeIdBySlug, booking?.id]);

  const minCheckOut = checkIn
    ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().slice(0, 10)
    : '';

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    if (val >= checkOut) {
      setCheckOut(new Date(new Date(val).getTime() + 86400000).toISOString().slice(0, 10));
    }
  }

  const autoTotal = calcGroupsTotal(rooms, roomGroups, checkIn, checkOut);
  const grossTotal = manualAmount ?? autoTotal;
  const discount = resolveDiscountAmount(discountMode, discountAmount, discountPercent, grossTotal);
  const total = Math.max(0, grossTotal - discount);
  const { weekdayNights, weekendNights } = calcNightsBreakdown(checkIn, checkOut);

  function hasChanges(): boolean {
    if (!booking) return false;
    if (name.trim() !== booking.guestName) return true;
    if (phone.trim() !== booking.guestPhone) return true;
    if ((notes.trim() || '') !== (booking.notes ?? '')) return true;
    if (checkIn !== booking.checkIn.slice(0, 10)) return true;
    if (checkOut !== booking.checkOut.slice(0, 10)) return true;

    // Rooms
    if (roomGroups.length !== booking.items.length) return true;
    for (let i = 0; i < roomGroups.length; i++) {
      const g = roomGroups[i];
      const orig = booking.items[i];
      if (g.slug !== orig.roomTypeSlug) return true;
      if (g.adults !== orig.adults) return true;
      if (g.children !== orig.children) return true;
      if (g.extraBedQty !== orig.extraBedQty) return true;
    }

    // Harga manual
    const origGross = booking.isPriceOverride
      ? booking.priceSnapshot + booking.discount
      : null;
    if (manualAmount !== origGross) return true;

    // Diskon
    if (discount !== booking.discount) return true;

    return false;
  }

  async function handleSave() {
    if (!booking) return;
    if (!name.trim() || !phone.trim() || roomGroups.length === 0) {
      setError(t('admin.bookingIncomplete'));
      return;
    }
    if (!hasChanges()) {
      setError('Tidak ada data yang diubah — ubah minimal satu field sebelum menyimpan.');
      return;
    }
    if (!editNote.trim() || editNote.trim().length < 3) {
      setError('Alasan edit wajib diisi (minimal 3 karakter)');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const items: EditBookingItemInput[] = roomGroups.map((g) => ({
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

      await editBooking(token!, code, {
        guestName: name.trim(),
        guestPhone: phone.trim(),
        checkIn,
        checkOut,
        notes: notes.trim() || undefined,
        items,
        priceOverride: manualAmount !== null ? manualAmount : undefined,
        discount: discount || undefined,
        note: editNote.trim(),
      });

      router.push('/admin/penginapan/booking');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <DashboardLayout title="Edit Booking">
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

  if (!booking) {
    return (
      <DashboardLayout title="Edit Booking">
        <Card>
          <CardContent className="text-muted p-5 text-center text-sm sm:p-7">
            Memuat data...
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const displayed = toDisplay(booking);
  const status = displayStatus(displayed);

  return (
    <DashboardLayout title={`Edit Booking — ${code}`}>
      <Card>
        <CardContent className="p-5 sm:p-7">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <span className="text-forest-700 font-serif text-xl font-extrabold">{code}</span>
            <StatusBadge status={status} />
            <span className="text-muted text-[12px]">
              {booking.bookingChannel === 'WALK_IN' ? 'Walk-in' : 'WhatsApp'}
            </span>
          </div>
          <p className="text-muted mt-0.5 text-[12.5px]">
            Semua perubahan akan dicatat di riwayat edit beserta alasannya.
          </p>

          <div className="mt-5.5 grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label={`${t('admin.guestName')} *`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label={t('admin.guestPhone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
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
                onChange={(e) => setNotes(e.target.value)}
              />
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
              <Input
                type="text"
                inputMode="numeric"
                value={manualAmount != null ? manualAmount.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setManualAmount(raw === '' ? 0 : Number(raw));
                }}
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
              onChange={(e) => setEditNote(e.target.value)}
            />
            <p className="text-muted mt-1 text-[12px]">
              Wajib diisi — tersimpan permanen di riwayat audit untuk transparansi Owner.
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
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
