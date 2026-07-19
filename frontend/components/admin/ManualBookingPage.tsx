'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Input, Select } from '@/components/ui';
import { rooms } from '@/lib/data/rooms';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function ManualBookingPage() {
  const { t } = useTranslation();

  const roomOptions = rooms.map((r) => ({ value: r.slug, label: r.name }));
  const guestOptions = [
    { value: '2', label: '2 tamu' },
    { value: '4', label: '4 tamu' },
  ];
  const payOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'qris', label: 'QRIS' },
    { value: 'transfer', label: 'Transfer' },
  ];

  return (
    <DashboardLayout title={t('dashboard.manualBooking')}>
      <div className="border-border max-w-[820px] rounded-2xl border bg-white p-7">
        <div className="text-[17px] font-bold">{t('admin.manualTitle')}</div>
        <div className="text-muted mt-1 text-[13px]">{t('admin.manualSubtitle')}</div>

        <div className="mt-5.5 grid gap-4.5 sm:grid-cols-2">
          <Input label={`${t('admin.guestName')} *`} name="name" placeholder="Nama lengkap" />
          <Input label={`${t('booking.phone')} *`} name="phone" placeholder="08xx" />
          <div className="sm:col-span-2">
            <Input label={t('admin.emailOpt')} name="email" type="email" placeholder="email@contoh.com" />
          </div>
          <Select label={t('admin.lodgingType')} name="room" options={roomOptions} />
          <Select label={t('admin.guests')} name="guests" options={guestOptions} />
          <Input label={t('admin.tCheckIn')} name="checkIn" type="date" defaultValue="2026-07-18" />
          <Input label={t('admin.tCheckOut')} name="checkOut" type="date" defaultValue="2026-07-20" />
        </div>

        {/* Availability info */}
        <div className="mt-4.5 rounded-[10px] bg-[#E4F1E7] px-3.5 py-3 text-[13px] font-medium text-[#2f6b41]">
          ✓ {rooms[0].name} {t('admin.availableInfo')}
        </div>

        <div className="mt-4.5 grid gap-4.5 sm:grid-cols-2">
          <Select label={t('admin.payMethod')} name="payMethod" options={payOptions} />
          <Input label={t('admin.amount')} name="amount" defaultValue="Rp2.625.000" />
        </div>

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
