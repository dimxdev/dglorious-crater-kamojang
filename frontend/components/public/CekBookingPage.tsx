'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function CekBookingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [code, setCode] = useState('DGC-48213');

  // TODO(FASE 5): validasi kode + no. WA lewat `GET /bookings/:code`.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/booking/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="mx-auto max-w-[520px] px-7 pt-20 pb-30">
      <div className="text-center">
        <div className="eyebrow">{t('cek.eyebrow')}</div>
        <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">
          {t('cek.title')}
        </h1>
        <p className="text-muted mt-2 text-[15px]">{t('cek.subtitle')}</p>
      </div>

      <form
        onSubmit={submit}
        className="border-border mt-8 rounded-[20px] border bg-white p-7 shadow-[0_20px_44px_-30px_rgba(20,53,42,0.5)]"
      >
        <div className="flex flex-col gap-4.5">
          <Input
            label={t('cek.code')}
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="tracking-[0.05em]"
          />
          <Input
            label={t('cek.phone')}
            name="phone"
            defaultValue="0812-3456-7890"
          />
          <Button type="submit" fullWidth className="rounded-xl">
            {t('cek.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
