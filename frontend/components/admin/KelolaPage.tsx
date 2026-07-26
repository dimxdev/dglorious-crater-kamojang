'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge, Button, ImagePlaceholder, Input, Select } from '@/components/ui';
import { FacilityListEditor, type FacilityRow } from './FacilityListEditor';
import { cn } from '@/lib/cn';
import { cmsRooms } from '@/lib/data/admin';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';

const LANGS = ['ID', 'EN', '中文'] as const;

const INITIAL_FACILITIES: FacilityRow[] = [
  { icon: 'Wifi', label: { ID: 'Wi-Fi', EN: 'Wi-Fi', '中文': 'Wi-Fi' } },
  { icon: 'UtensilsCrossed', label: { ID: 'Sarapan', EN: 'Breakfast', '中文': '早餐' } },
];

export function KelolaPage() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <DashboardLayout title={t('dashboard.manage')}>
      <div className="flex items-center justify-between">
        <div className="text-muted text-sm">
          {t('admin.activeCount', { n: cmsRooms.length })}
        </div>
        <Button className="rounded-xl" onClick={() => setDrawerOpen(true)}>
          {t('admin.addRoom')}
        </Button>
      </div>

      {/* Table */}
      <div className="border-border mt-4 overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead className="bg-cream-100 text-muted text-[11px] uppercase">
              <tr>
                <th className="px-4 py-3.5">{t('admin.photo')}</th>
                <th className="px-4 py-3.5">{t('admin.name')}</th>
                <th className="px-4 py-3.5">{t('admin.category')}</th>
                <th className="px-4 py-3.5">{t('admin.priceWeekday')}</th>
                <th className="px-4 py-3.5">{t('admin.priceWeekend')}</th>
                <th className="px-4 py-3.5">{t('admin.capacity')}</th>
                <th className="px-4 py-3.5">{t('admin.unit')}</th>
                <th className="px-4 py-3.5">{t('admin.tStatus')}</th>
                <th className="px-4 py-3.5">{t('admin.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {cmsRooms.map((r) => (
                <tr key={r.slug}>
                  <td className="px-4 py-3">
                    <div className="h-10.5 w-14 overflow-hidden rounded-lg">
                      <ImagePlaceholder icon={r.icon} />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="text-muted px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3">{formatIDR(r.priceWeekday)}</td>
                  <td className="px-4 py-3">{formatIDR(r.priceWeekend)}</td>
                  <td className="text-muted px-4 py-3">{r.capacity} tamu</td>
                  <td className="text-muted px-4 py-3">{r.units}</td>
                  <td className="px-4 py-3">
                    <Badge tone="success">{t('admin.active')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="mr-3 font-semibold text-[#2c5a8a]"
                    >
                      {t('admin.edit')}
                    </button>
                    <button className="font-semibold text-[#b23b30]">
                      {t('admin.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen && <CmsDrawer onClose={() => setDrawerOpen(false)} />}
    </DashboardLayout>
  );
}

function CmsDrawer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [lang, setLang] = useState<(typeof LANGS)[number]>('ID');
  const [facilities, setFacilities] = useState<FacilityRow[]>(INITIAL_FACILITIES);

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <button aria-hidden tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#141916]/50" />
      <div className="relative z-10 flex h-screen w-[560px] max-w-full flex-col bg-[#f4f1ea] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e2d5] bg-white px-6 py-4.5">
          <div className="font-serif text-xl font-bold">{t('admin.cmsTitle')}</div>
          <button onClick={onClose} className="text-xl text-[#999]" aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Multi-language */}
          <div className="text-muted text-xs font-semibold tracking-[0.06em] uppercase">
            {t('admin.cmsMultiLang')}
          </div>
          <div className="mt-2.5 flex gap-2">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'rounded-[10px] border px-4.5 py-2 text-[13px] font-semibold',
                  lang === l
                    ? 'border-forest-700 bg-forest-700 text-white'
                    : 'border-border bg-white',
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="border-border mt-3 rounded-[14px] border bg-white p-5">
            <div className="mb-4 rounded-lg bg-[#FBEFD5] px-3 py-2 text-xs text-[#8a6d1f]">
              {t('admin.cmsIdRequired')}
            </div>
            <div className="flex flex-col gap-3.5">
              <Input label={`${t('admin.cmsName')} (${lang})`} name="name" placeholder="Nama penginapan" />
              <LabeledTextarea label={`${t('admin.cmsDesc')} (${lang})`} placeholder="Deskripsi penginapan" rows={3} />
              <div>
                <label className="text-foreground text-sm font-medium">
                  {`${t('admin.cmsFacilities')} (${lang})`}
                </label>
                <div className="mt-1.5">
                  <FacilityListEditor
                    value={facilities}
                    onChange={setFacilities}
                    lang={lang}
                    addLabel={t('admin.cmsAddFacility')}
                    labelPlaceholder={t('admin.cmsFacilitiesHint')}
                  />
                </div>
              </div>
              <LabeledTextarea label={`${t('admin.cmsRules')} (${lang})`} placeholder="Aturan menginap" rows={2} />
            </div>
          </div>

          {/* Universal */}
          <div className="text-muted mt-5.5 text-xs font-semibold tracking-[0.06em] uppercase">
            {t('admin.cmsUniversal')}
          </div>
          <div className="border-border mt-2.5 grid grid-cols-2 gap-3.5 rounded-[14px] border bg-white p-5">
            <Select
              label={t('admin.category')}
              name="category"
              options={[
                { value: 'cottage', label: 'Cottage' },
                { value: 'glamping', label: 'Glamping' },
                { value: 'tenda', label: 'Tenda' },
                { value: 'area', label: 'Area Camping' },
              ]}
            />
            <Input label={t('admin.capacity')} name="capacity" defaultValue="4 tamu" />
            <Input label={t('admin.priceWeekday')} name="priceWeekday" defaultValue="Rp1.000.000" />
            <Input label={t('admin.priceWeekend')} name="priceWeekend" defaultValue="Rp1.200.000" />
            <Input label={t('admin.cmsBedInfo')} name="bedInfo" defaultValue="1 Queen Bed" />
            <Input label={t('admin.cmsBathroomInfo')} name="bathroomInfo" defaultValue="Kamar mandi privat" />
            <Input label={t('admin.extraBedPrice')} name="extraBedPrice" defaultValue="Rp250.000" />
            <Input label={t('admin.extraNoBedPrice')} name="extraNoBedPrice" defaultValue="Rp175.000" />
            <Input label={t('admin.cmsUnitCount')} name="units" defaultValue="4" />
            <Select
              label={t('admin.tStatus')}
              name="status"
              options={[
                { value: 'active', label: t('admin.active') },
                { value: 'inactive', label: t('admin.inactive') },
              ]}
            />
            <Input label={t('admin.cmsCheckInTime')} name="checkIn" defaultValue="14.00" />
            <Input label={t('admin.cmsCheckOutTime')} name="checkOut" defaultValue="12.00" />
          </div>

          {/* Gallery */}
          <div className="text-muted mt-5.5 text-xs font-semibold tracking-[0.06em] uppercase">
            {t('admin.cmsGallery')}
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-2.5">
            <div className="border-terracotta-500 relative aspect-square overflow-hidden rounded-[10px] border-2">
              <ImagePlaceholder icon="🖼️" />
              <span className="bg-terracotta-500 absolute top-1 left-1 rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                {t('admin.cmsCover')}
              </span>
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-input flex aspect-square items-center justify-center rounded-[10px] border border-dashed text-2xl text-[#c9b795]"
              >
                +
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3 pb-4">
            <Button className="rounded-xl" onClick={onClose}>
              {t('admin.cmsSave')}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={onClose}>
              {t('admin.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledTextarea({
  label,
  placeholder,
  rows,
}: {
  label: string;
  placeholder: string;
  rows: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-foreground text-sm font-medium">{label}</label>
      <textarea
        rows={rows}
        placeholder={placeholder}
        className="border-input focus:border-forest-500 focus:ring-forest-500/20 resize-none rounded-[10px] border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
      />
    </div>
  );
}
