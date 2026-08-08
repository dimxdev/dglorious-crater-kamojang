'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, Input, Select } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { createBooking, type CreateBookingItemInput } from '@/lib/api/bookings';
import { fetchAdminRoomTypes } from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { localizeRooms } from '@/lib/data/rooms';
import { formatIDR } from '@/lib/format';
import { calcGroupsTotal, calcNightsBreakdown } from '@/lib/pricing';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import {
  DiscountField,
  resolveDiscountAmount,
  type DiscountMode,
} from './DiscountField';
import { RoomGroupEditor, type RoomGroup } from './RoomGroupEditor';

const INITIAL_GROUP: RoomGroup = {
  slug: '',
  adults: 2,
  children: 0,
  extraBedQty: 0,
  extraBedType: 'with',
};

// Sesuai form reservasi WhatsApp resmi klien: nego, DP, & pelunasan terjadi
// di WhatsApp (di luar sistem). Admin cuma mencatat begitu sudah "clear" —
// booking sudah pasti tapi tamunya belum tiba (masih perlu Check-in nanti).
export function BookingWhatsappPage() {
  const { t, locale } = useTranslation();
  const { token } = useAuth();
  const rooms = localizeRooms(locale);

  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([
    { ...INITIAL_GROUP, slug: rooms[0]?.slug ?? '' },
  ]);
  const [checkIn, setCheckIn] = useState('2026-07-18');
  const [checkOut, setCheckOut] = useState('2026-07-20');
  const [manualAmount, setManualAmount] = useState<number | null>(null);
  const [discountMode, setDiscountMode] = useState<DiscountMode>('amount');
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'DP' | 'LUNAS'>('DP');
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  const [roomTypeIdBySlug, setRoomTypeIdBySlug] = useState<
    Record<string, number>
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
        setRoomTypeIdBySlug(
          Object.fromEntries(list.map((r) => [r.slug, r.id])),
        );
      })
      .catch(() => {
        // Diam-diam gagal — error baru muncul kalau admin coba Simpan.
      });
  }, [token]);

  const paymentStatusOptions = [
    { value: 'DP', label: t('admin.dp') },
    { value: 'LUNAS', label: t('admin.lunas') },
  ];

  const autoTotal = calcGroupsTotal(rooms, roomGroups, checkIn, checkOut);
  const grossTotal = manualAmount ?? autoTotal;
  const discount = resolveDiscountAmount(
    discountMode,
    discountAmount,
    discountPercent,
    grossTotal,
  );
  const total = Math.max(0, grossTotal - discount);
  const { weekdayNights, weekendNights } = calcNightsBreakdown(
    checkIn,
    checkOut,
  );

  async function handleSave() {
    setError(null);
    setSavedCode(null);

    if (!name.trim() || !phone.trim() || roomGroups.length === 0) {
      setError(t('admin.bookingIncomplete'));
      return;
    }
    if (paymentStatus === 'DP' && (paidAmount === null || paidAmount <= 0)) {
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
        bookingChannel: 'WHATSAPP',
        initialStatus: paymentStatus,
        paidAmount:
          paymentStatus === 'DP' ? (paidAmount ?? undefined) : undefined,
        notes: notes.trim() || undefined,
        isPriceOverride: manualAmount !== null,
        manualTotal: manualAmount ?? undefined,
        discount: discount || undefined,
        items,
      });

      setSavedCode(created.bookingCode);
      setName('');
      setPhone('');
      setNotes('');
      setPaymentStatus('DP');
      setPaidAmount(null);
      setManualAmount(null);
      setDiscountMode('amount');
      setDiscountAmount(null);
      setDiscountPercent(null);
      setRoomGroups([{ ...INITIAL_GROUP, slug: rooms[0]?.slug ?? '' }]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title={t('dashboard.bookingWhatsapp')}>
      <Card>
        <CardContent className="p-5 sm:p-7">
          <div className="text-[17px] font-bold">
            {t('admin.waBookingTitle')}
          </div>
          <div className="text-muted mt-1 text-[13px]">
            {t('admin.waBookingSubtitle')}
          </div>

          <div className="mt-5.5 grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label={`${t('admin.guestName')} *`}
              name="name"
              placeholder="Nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label={`${t('admin.guestPhone')} *`}
              name="phone"
              placeholder="08xx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label={t('admin.tCheckIn')}
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
            <Input
              label={t('admin.tCheckOut')}
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
          {(weekdayNights > 0 || weekendNights > 0) && (
            <p className="text-muted mt-2 text-[12px]">
              {t('admin.nightsBreakdown', {
                weekday: weekdayNights,
                weekend: weekendNights,
              })}
            </p>
          )}

          {/* Grup tenda: tipe + jumlah + dewasa/anak/extra bed + subtotal masing-masing */}
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
            <p className="text-muted mt-2 text-[12px]">
              {t('admin.childrenRuleHint')}
            </p>
          </div>

          <div className="mt-4.5 grid gap-4.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label={t('admin.notes')}
                name="notes"
                placeholder={t('admin.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Select
              label={t('admin.paymentStatus')}
              name="paymentStatus"
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(e.target.value as 'DP' | 'LUNAS')
              }
              options={paymentStatusOptions}
            />
            <DiscountField
              mode={discountMode}
              onModeChange={setDiscountMode}
              amount={discountAmount}
              onAmountChange={setDiscountAmount}
              percent={discountPercent}
              onPercentChange={setDiscountPercent}
              grossTotal={grossTotal}
            />
            {paymentStatus === 'DP' && (
              <div>
                <Input
                  label={t('admin.paidAmount')}
                  name="paidAmount"
                  type="number"
                  min={1}
                  value={paidAmount ?? ''}
                  onChange={(e) =>
                    setPaidAmount(
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                />
                <p className="text-muted mt-1 text-[12px]">
                  {t('admin.paidAmountHint')}
                </p>
              </div>
            )}
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
            <span className="text-[13px] font-medium text-green-800">
              {t('admin.amount')}
            </span>
            <span className="text-lg font-bold text-green-700">
              {formatIDR(total)}
            </span>
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
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(Number(e.target.value) || 0)}
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
          <p className="text-muted mt-2 text-[12px]">
            {t('admin.amountOverrideHint')}
          </p>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {savedCode && (
            <p className="mt-4 text-sm font-semibold text-green-700">
              {t('admin.bookingSaved', { code: savedCode })}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              className="rounded-xl"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('admin.saving') : t('admin.saveConfirm')}
            </Button>
            <Button variant="outline" className="rounded-xl" disabled={saving}>
              {t('admin.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
