'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { PaymentModal } from './PaymentModal';

type Status = 'unpaid' | 'confirmed' | 'expired' | 'completed';
const DEMO_TOTAL = 1785000;

export function BookingDetailPage({ kode }: { kode: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('confirmed');
  const [paymentOpen, setPaymentOpen] = useState(false);

  const tabs: { id: Status; label: string }[] = [
    { id: 'unpaid', label: t('status.unpaidTab') },
    { id: 'confirmed', label: t('status.confirmedTab') },
    { id: 'expired', label: t('status.expiredTab') },
    { id: 'completed', label: t('status.completedTab') },
  ];

  return (
    <div className="mx-auto max-w-[720px] px-7 pt-10 pb-24">
      {/* Demo status switcher */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[#d9c9a8] bg-[#fef8ee] px-3.5 py-2.5 text-[12.5px] text-[#8a7a55]">
        <b>{t('status.demoPreview')}</b>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            className={cn(
              'rounded-full border border-[#d9c9a8] px-3 py-1.5 text-xs font-semibold',
              status === tab.id ? 'bg-forest-700 text-white' : 'bg-white',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {status === 'unpaid' && (
        <div className="border-border mt-5 overflow-hidden rounded-[22px] border bg-white shadow-[0_20px_44px_-30px_rgba(20,53,42,0.5)]">
          <div className="flex items-center gap-3.5 border-b border-[#f0e2c2] bg-[#FBEFD5] px-7 py-5.5">
            <div className="text-3xl">⏳</div>
            <div>
              <div className="text-[18px] font-bold text-[#8a6d1f]">
                {t('status.unpaidTitle')}
              </div>
              <div className="text-[13px] text-[#a08b4f]">{t('status.unpaidDesc')}</div>
            </div>
          </div>
          <div className="p-7">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="text-muted text-xs">{t('status.code')}</div>
                <div className="text-forest-700 font-serif text-[26px] font-extrabold">
                  {kode}
                </div>
              </div>
              <div className="rounded-xl bg-[#fdf1f1] px-4.5 py-3 text-right">
                <div className="text-xs text-[#b4443b]">{t('status.payBefore')}</div>
                <div className="text-base font-bold text-[#c0392b]">20 Jul 2026, 14:00</div>
                <div className="mt-0.5 text-xs text-[#c0392b]">⏱ {t('status.remaining')} 05:48:12</div>
              </div>
            </div>
            <div className="text-muted-strong mt-5 border-t border-dashed border-[#e2dccb] pt-4 text-sm">
              <div className="mb-2 flex justify-between">
                <span>Glamping Deluxe</span>
                <span>20–22 Jul · 2 malam</span>
              </div>
              <div className="text-foreground flex justify-between text-[17px] font-bold">
                <span>{t('status.total')}</span>
                <span>{formatIDR(DEMO_TOTAL)}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              fullWidth
              className="mt-5.5 rounded-xl"
              onClick={() => setPaymentOpen(true)}
            >
              {t('status.continuePayment')}
            </Button>
          </div>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="border-border mt-5 overflow-hidden rounded-[22px] border bg-white shadow-[0_20px_44px_-30px_rgba(20,53,42,0.5)]">
          <div className="from-forest-700 to-forest-500 bg-linear-to-br px-7 py-6.5 text-cream-100">
            <div className="flex items-center gap-2.5 text-[13px] tracking-[0.14em] uppercase opacity-85">
              ✓ {t('status.confirmedEyebrow')}
            </div>
            <div className="mt-1.5 font-serif text-[34px] font-extrabold tracking-[0.04em]">
              {kode}
            </div>
          </div>
          <div className="grid grid-cols-1 items-center gap-6 p-7 sm:grid-cols-[1fr_150px]">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('status.guestName')} value="Andini Rahmawati" />
              <Field label={t('status.lodging')} value="Glamping Deluxe" />
              <Field label={t('detail.checkIn')} value="20 Jul 2026, 14.00" />
              <Field label={t('detail.checkOut')} value="22 Jul 2026, 12.00" />
            </div>
            <div className="text-center">
              <div className="bg-forest-700 mx-auto h-32.5 w-32.5 rounded-[14px] p-3">
                <div
                  className="h-full w-full rounded-md"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg,#fff 0 4px,#1b4332 4px 8px),repeating-linear-gradient(0deg,#fff 0 4px,#1b4332 4px 8px)',
                    backgroundBlendMode: 'multiply',
                  }}
                />
              </div>
              <div className="text-muted mt-2 text-[11px]">{t('status.showAtCheckin')}</div>
            </div>
          </div>
          <div className="flex gap-3 px-7 pb-7">
            <Button className="flex-1 rounded-xl">⬇ {t('status.downloadPdf')}</Button>
            <Button variant="outline" className="rounded-xl">
              {t('status.share')}
            </Button>
          </div>
        </div>
      )}

      {status === 'expired' && (
        <div className="border-border mt-5 rounded-[22px] border bg-white p-11 text-center shadow-[0_20px_44px_-30px_rgba(20,53,42,0.5)]">
          <div className="mx-auto flex h-17.5 w-17.5 items-center justify-center rounded-full bg-[#fdeceb] text-4xl">
            ⌛
          </div>
          <div className="mt-4.5 text-xl font-bold text-[#c0392b]">
            {t('status.expiredTitle')}
          </div>
          <p className="text-muted mx-auto mt-2 max-w-[380px] text-[14.5px]">
            {t('status.expiredDesc', { code: kode })}
          </p>
          <Link href="/penginapan" className="mt-6 inline-block">
            <Button className="rounded-xl">{t('status.rebook')}</Button>
          </Link>
        </div>
      )}

      {status === 'completed' && (
        <div className="border-border mt-5 rounded-[22px] border bg-white p-11 text-center shadow-[0_20px_44px_-30px_rgba(20,53,42,0.5)]">
          <div className="mx-auto flex h-17.5 w-17.5 items-center justify-center rounded-full bg-[#e8f2ea] text-4xl">
            🌿
          </div>
          <div className="text-forest-700 mt-4.5 text-xl font-bold">
            {t('status.completedTitle')}
          </div>
          <p className="text-muted mx-auto mt-2 max-w-[400px] text-[14.5px]">
            {t('status.completedDesc', { code: kode })}
          </p>
          <div className="text-accent mt-4.5 text-[26px]">★★★★★</div>
          <Link href="/penginapan" className="mt-5 inline-block">
            <Button variant="secondary" className="rounded-xl">
              {t('status.bookAgain')}
            </Button>
          </Link>
        </div>
      )}

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={DEMO_TOTAL}
        orderId={kode}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted text-xs">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
