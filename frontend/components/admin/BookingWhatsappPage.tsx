'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Input, Select } from '@/components/ui';
import { RoomGroupEditor, type RoomGroup } from './RoomGroupEditor';
import { localizeRooms } from '@/lib/data/rooms';
import { formatIDR } from '@/lib/format';
import { calcGroupsTotal, calcNightsBreakdown } from '@/lib/pricing';
import { useTranslation } from '@/lib/i18n/I18nProvider';

// Sesuai form reservasi WhatsApp resmi klien: nego, DP, & pelunasan terjadi
// di WhatsApp (di luar sistem). Admin cuma mencatat begitu sudah "clear" —
// booking sudah pasti tapi tamunya belum tiba (masih perlu Check-in nanti).
export function BookingWhatsappPage() {
  const { t, locale } = useTranslation();
  const rooms = localizeRooms(locale);

  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([
    { slug: rooms[0]?.slug ?? '', adults: 2, children: 0, extraBedQty: 0, extraBedType: 'with' },
  ]);
  const [checkIn, setCheckIn] = useState('2026-07-18');
  const [checkOut, setCheckOut] = useState('2026-07-20');
  const [manualAmount, setManualAmount] = useState<number | null>(null);

  const paymentStatusOptions = [
    { value: 'DP', label: t('admin.dp') },
    { value: 'LUNAS', label: t('admin.lunas') },
  ];

  const autoTotal = calcGroupsTotal(rooms, roomGroups, checkIn, checkOut);
  const total = manualAmount ?? autoTotal;
  const { weekdayNights, weekendNights } = calcNightsBreakdown(checkIn, checkOut);

  return (
    <DashboardLayout title={t('dashboard.bookingWhatsapp')}>
      <div className="border-border max-w-205 rounded-2xl border bg-white p-7">
        <div className="text-[17px] font-bold">{t('admin.waBookingTitle')}</div>
        <div className="text-muted mt-1 text-[13px]">{t('admin.waBookingSubtitle')}</div>

        <div className="mt-5.5 grid gap-4.5 sm:grid-cols-2">
          <Input label={`${t('admin.guestName')} *`} name="name" placeholder="Nama lengkap" />
          <Input label={`${t('admin.guestPhone')} *`} name="phone" placeholder="08xx" />
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
            {t('admin.nightsBreakdown', { weekday: weekdayNights, weekend: weekendNights })}
          </p>
        )}

        {/* Grup tenda: tipe + jumlah + dewasa/anak/extra bed + subtotal masing-masing */}
        <div className="mt-4.5">
          <label className="text-foreground text-sm font-medium">{t('admin.lodgingType')}</label>
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
          <p className="text-muted mt-2 text-[12px]">{t('admin.childrenRuleHint')}</p>
        </div>

        <div className="mt-4.5 grid gap-4.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label={t('admin.notes')} name="notes" placeholder={t('admin.notesPlaceholder')} />
          </div>
          <div>
            <label className="text-foreground text-sm font-medium">{t('admin.ktpPhoto')}</label>
            <div className="border-input mt-1.5 flex h-11 items-center justify-center rounded-[10px] border border-dashed text-xl text-[#c9b795]">
              +
            </div>
          </div>
          <Select label={t('admin.paymentStatus')} name="paymentStatus" options={paymentStatusOptions} />
        </div>

        <div className="mt-4.5 flex items-center justify-between rounded-[10px] bg-[#E4F1E7] px-3.5 py-3">
          <span className="text-[13px] font-medium text-[#2f6b41]">{t('admin.amount')}</span>
          <span className="text-forest-700 text-lg font-bold">{formatIDR(total)}</span>
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
        <p className="text-muted mt-2 text-[12px]">{t('admin.amountOverrideHint')}</p>

        <div className="mt-6 flex gap-3">
          <Button className="rounded-xl">{t('admin.saveConfirm')}</Button>
          <Button variant="outline" className="rounded-xl">
            {t('admin.cancel')}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
