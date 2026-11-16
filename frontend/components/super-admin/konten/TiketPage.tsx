'use client';

import { CollectionEditor } from '@/components/super-admin/cms/CollectionEditor';
import { SectionCard } from '@/components/super-admin/cms/SectionEditor';
import { BilingualField, PriceField, RepeatList, emptyL } from '@/components/super-admin/cms/controls';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ContentPage, optionalL, useCollectionText, useSectionText } from './shared';

export function TiketPage() {
  const { t } = useTranslation();
  const s = useSectionText();
  const c = useCollectionText();
  const toc = [
    { id: 's-about_tickets', label: s('about_tickets').title },
    { id: 'c-TICKET_PACKAGE', label: c('TICKET_PACKAGE').title },
    { id: 's-about_parking', label: s('about_parking').title },
    { id: 'c-PARKING_FEE', label: c('PARKING_FEE').title },
  ];

  return (
    <ContentPage title={t('superAdmin.nav.tickets')} descriptionKey="superAdmin.pages.tickets" viewHref="/tentang" toc={toc}>
      <SectionCard sectionKey="about_tickets" {...s('about_tickets')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.note')} value={draft.note} multiline rows={3} onChange={(v) => patch({ note: v })} />
          </>
        )}
      </SectionCard>

      <CollectionEditor
        collection="TICKET_PACKAGE"
        {...c('TICKET_PACKAGE')}
        makeEmpty={() => ({ name: emptyL(), benefits: [], priceDay: 0, priceNight: 0 })}
        summarize={(x) => ({
          title: x.name,
          meta: t('superAdmin.f.priceSummary', { day: formatIDR(x.priceDay), night: formatIDR(x.priceNight) }),
        })}
        renderForm={(d, set) => (
          <>
            <BilingualField label={t('superAdmin.f.name')} value={d.name} onChange={(v) => set({ ...d, name: v })} />
            <BilingualField
              label={t('superAdmin.f.note')}
              hint={t('superAdmin.f.optional')}
              value={d.note ?? emptyL()}
              multiline
              rows={2}
              onChange={(v) => set(optionalL(d, 'note', v))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField label={t('superAdmin.f.priceDay')} value={d.priceDay} onChange={(v) => set({ ...d, priceDay: v })} />
              <PriceField label={t('superAdmin.f.priceNight')} value={d.priceNight} onChange={(v) => set({ ...d, priceNight: v })} />
            </div>
            <div>
              <div className="text-foreground mb-2 text-[13px] font-semibold">{t('superAdmin.f.benefits')}</div>
              <RepeatList
                items={d.benefits}
                onChange={(benefits) => set({ ...d, benefits })}
                makeEmpty={emptyL}
                addLabel={t('superAdmin.f.addBenefit')}
                itemLabel={(i) => t('superAdmin.f.benefitN', { n: i + 1 })}
                emptyText={t('superAdmin.f.benefitsEmpty')}
                renderItem={(item, update, i) => (
                  <BilingualField label={t('superAdmin.f.benefitN', { n: i + 1 })} value={item} onChange={update} />
                )}
              />
            </div>
          </>
        )}
      />

      <SectionCard sectionKey="about_parking" {...s('about_parking')}>
        {({ draft, patch }) => (
          <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
        )}
      </SectionCard>

      <CollectionEditor
        collection="PARKING_FEE"
        {...c('PARKING_FEE')}
        makeEmpty={() => ({ vehicle: emptyL(), price: 0 })}
        summarize={(x) => ({ title: x.vehicle, meta: formatIDR(x.price) })}
        renderForm={(d, set) => (
          <>
            <BilingualField label={t('superAdmin.f.vehicle')} value={d.vehicle} onChange={(v) => set({ ...d, vehicle: v })} />
            <PriceField label={t('superAdmin.f.price')} value={d.price} onChange={(v) => set({ ...d, price: v })} />
          </>
        )}
      />
    </ContentPage>
  );
}
