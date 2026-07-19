'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge, Button } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/I18nProvider';

type State = 'idle' | 'found' | 'used' | 'done';
const USED_CODE = 'DGC-48208';

export function CheckinPage() {
  const { t } = useTranslation();
  const [code, setCode] = useState('DGC-48213');
  const [state, setState] = useState<State>('idle');

  const search = () => setState(code.trim().toUpperCase() === USED_CODE ? 'used' : 'found');

  return (
    <DashboardLayout title={t('dashboard.checkin')}>
      <div className="mx-auto max-w-[640px]">
        {/* Search box */}
        <div className="border-border rounded-2xl border bg-white p-8 text-center">
          <div className="font-serif text-[22px] font-bold">{t('admin.checkinTitle')}</div>
          <div className="text-muted mt-1 text-[13px]">{t('admin.checkinSubtitle')}</div>
          <div className="mt-5.5 flex gap-2.5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border-input focus:border-forest-500 flex-1 rounded-xl border-[1.5px] px-4.5 py-3.5 text-center text-lg font-semibold tracking-[0.06em] outline-none"
            />
            <Button onClick={search} className="rounded-xl px-6">
              {t('admin.search')}
            </Button>
          </div>
          <div className="mt-2.5 text-xs text-[#aaa]">
            {t('admin.tryHint')}{' '}
            <button
              onClick={() => {
                setCode('DGC-48213');
                setState('found');
              }}
              className="text-accent font-semibold"
            >
              DGC-48213
            </button>{' '}
            ({t('admin.valid')}) ·{' '}
            <button
              onClick={() => {
                setCode(USED_CODE);
                setState('used');
              }}
              className="text-accent font-semibold"
            >
              {USED_CODE}
            </button>{' '}
            ({t('admin.used')})
          </div>
        </div>

        {/* Found */}
        {state === 'found' && (
          <div className="border-border mt-4.5 rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-forest-700 font-serif text-[22px] font-extrabold">
                {code}
              </div>
              <Badge tone="info">Confirmed</Badge>
            </div>
            <div className="mt-4.5 grid grid-cols-2 gap-3.5 text-sm">
              <Field label={t('status.guestName')} value="Andini Rahmawati" />
              <Field label={t('status.lodging')} value="Glamping Deluxe" />
              <Field label={t('admin.tCheckIn')} value="20 Jul 2026, 14.00" />
              <Field label={t('admin.tCheckOut')} value="22 Jul 2026, 12.00" />
            </div>
            <Button
              variant="secondary"
              fullWidth
              className="mt-5.5 rounded-xl"
              onClick={() => setState('done')}
            >
              {t('admin.doCheckin')}
            </Button>
          </div>
        )}

        {/* Used */}
        {state === 'used' && (
          <div className="mt-4.5 flex items-start gap-3.5 rounded-2xl border border-[#f2c9c4] bg-[#FBE6E4] p-6">
            <div className="text-[28px]">⚠️</div>
            <div>
              <div className="text-base font-bold text-[#b23b30]">
                {t('admin.ticketUsed')}
              </div>
              <div className="mt-1 text-[13.5px] text-[#a5564e]">
                {t('admin.ticketUsedDesc', { code: USED_CODE })}
              </div>
              <button
                onClick={() => setState('idle')}
                className="mt-3.5 rounded-[9px] border border-[#d99] bg-white px-4.5 py-2 text-[13px] font-semibold text-[#b23b30]"
              >
                {t('admin.tryOther')}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {state === 'done' && (
          <div className="mt-4.5 rounded-2xl border border-[#c3e0cb] bg-[#E4F1E7] p-8 text-center">
            <div className="text-[44px]">✅</div>
            <div className="mt-2.5 text-[19px] font-bold text-[#2f6b41]">
              {t('admin.checkinSuccess')}
            </div>
            <div className="mt-1 text-sm text-[#3d7a52]">
              Andini Rahmawati · {code} · 18 Jul 2026, 14:35
            </div>
            <Button className="mt-4.5 rounded-xl" onClick={() => setState('idle')}>
              {t('admin.checkinOther')}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
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
