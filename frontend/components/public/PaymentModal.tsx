'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';

type Method = 'qris' | 'va' | 'ewallet';

// TODO(FASE 5): ganti dengan Midtrans Snap. Ini hanya simulasi UI.
export function PaymentModal({
  open,
  onClose,
  total,
  orderId,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  orderId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [method, setMethod] = useState<Method>('qris');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const methods: { id: Method; icon: string; label: string; desc: string }[] = [
    { id: 'qris', icon: '📱', label: t('payment.qris'), desc: t('payment.qrisDesc') },
    { id: 'va', icon: '🏦', label: t('payment.va'), desc: t('payment.vaDesc') },
    { id: 'ewallet', icon: '👛', label: t('payment.ewallet'), desc: t('payment.ewalletDesc') },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
      <button
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-[#141916]/55"
      />
      <div className="relative z-10 w-100 max-w-full overflow-hidden rounded-[18px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eee] px-5.5 py-4.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-forest-700 flex h-7.5 w-7.5 items-center justify-center rounded-[7px] text-[13px] font-bold text-white">
              D
            </div>
            <div className="text-[15px] font-bold">D&apos;Glorious Crater</div>
          </div>
          <button onClick={onClose} className="text-xl text-[#999]" aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="px-5.5 py-5">
          <div className="text-[13px] text-[#777]">{t('payment.total')}</div>
          <div className="text-forest-700 text-[26px] font-extrabold">
            {formatIDR(total)}
          </div>
          <div className="mt-0.5 text-xs text-[#999]">Order ID: {orderId}</div>

          <div className="mt-5 mb-2.5 text-[13px] font-semibold">
            {t('payment.chooseMethod')}
          </div>
          <div className="flex flex-col gap-2">
            {methods.map((m) => {
              const active = m.id === method;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
                    active
                      ? 'border-terracotta-500 bg-[#fdf6f2]'
                      : 'border-[#e5e5e5] hover:border-[#ccc]',
                  )}
                >
                  <span className="text-[22px]">{m.icon}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-[#888]">{m.desc}</span>
                  </span>
                  <span
                    className={cn(
                      'h-4.5 w-4.5 rounded-full border-2',
                      active ? 'border-terracotta-500 border-[5px]' : 'border-[#ccc]',
                    )}
                  />
                </button>
              );
            })}
          </div>

          <button
            onClick={() => router.push('/booking/DGC-48213')}
            className="bg-forest-700 hover:bg-forest-800 mt-4.5 w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-colors"
          >
            {t('payment.payNow')}
          </button>
          <div className="mt-3 text-center text-[11px] text-[#aaa]">
            🔒 {t('payment.secured')}
          </div>
        </div>
      </div>
    </div>
  );
}
