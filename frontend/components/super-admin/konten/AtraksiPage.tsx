'use client';

import { CollectionEditor } from '@/components/super-admin/cms/CollectionEditor';
import { SectionCard } from '@/components/super-admin/cms/SectionEditor';
import { BilingualField, IconPicker, RepeatList, Switch, emptyL } from '@/components/super-admin/cms/controls';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ContentPage, useCollectionText, useSectionText } from './shared';

export function AtraksiPage() {
  const { t } = useTranslation();
  const s = useSectionText();
  const c = useCollectionText();
  const toc = [
    { id: 's-home_attractions', label: s('home_attractions').title },
    { id: 's-about_attractions', label: s('about_attractions').title },
    { id: 'c-ATTRACTION', label: c('ATTRACTION').title },
    { id: 's-facilities', label: s('facilities').title },
    { id: 'c-FACILITY_ZONE', label: c('FACILITY_ZONE').title },
  ];

  return (
    <ContentPage title={t('superAdmin.nav.attractions')} descriptionKey="superAdmin.pages.attractions" viewHref="/tentang" toc={toc}>
      <SectionCard sectionKey="home_attractions" {...s('home_attractions')}>
        {({ draft, patch }) => (
          <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
        )}
      </SectionCard>

      <SectionCard sectionKey="about_attractions" {...s('about_attractions')}>
        {({ draft, patch }) => (
          <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
        )}
      </SectionCard>

      <CollectionEditor
        collection="ATTRACTION"
        {...c('ATTRACTION')}
        hasImage
        imageLabel={t('superAdmin.f.photo')}
        makeEmpty={() => ({ name: emptyL(), desc: emptyL(), icon: 'Mountain', featured: false })}
        summarize={(x) => ({ title: x.name, meta: x.featured ? t('superAdmin.f.featuredMeta') : undefined })}
        renderForm={(d, set) => (
          <>
            <BilingualField label={t('superAdmin.f.name')} value={d.name} onChange={(v) => set({ ...d, name: v })} />
            <BilingualField label={t('superAdmin.f.desc')} value={d.desc} multiline rows={4} onChange={(v) => set({ ...d, desc: v })} />
            <IconPicker label={t('superAdmin.f.icon')} value={d.icon} onChange={(icon) => set({ ...d, icon })} />
            <Switch
              checked={d.featured}
              onChange={(featured) => set({ ...d, featured })}
              label={t('superAdmin.f.featuredOnHome')}
            />
          </>
        )}
      />

      <SectionCard sectionKey="facilities" {...s('facilities')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.note')} value={draft.note} multiline rows={3} onChange={(v) => patch({ note: v })} />
            <BilingualField label={t('superAdmin.f.disclaimer')} value={draft.disclaimer} multiline rows={3} onChange={(v) => patch({ disclaimer: v })} />
          </>
        )}
      </SectionCard>

      <CollectionEditor
        collection="FACILITY_ZONE"
        {...c('FACILITY_ZONE')}
        makeEmpty={() => ({ icon: 'Trees', name: emptyL(), note: emptyL(), items: [] })}
        summarize={(x) => ({ title: x.name, meta: t('superAdmin.f.itemCount', { n: x.items.length }) })}
        renderForm={(d, set) => (
          <>
            <IconPicker label={t('superAdmin.f.icon')} value={d.icon} onChange={(icon) => set({ ...d, icon })} />
            <BilingualField label={t('superAdmin.f.zoneName')} value={d.name} onChange={(v) => set({ ...d, name: v })} />
            <BilingualField label={t('superAdmin.f.note')} value={d.note} multiline rows={3} onChange={(v) => set({ ...d, note: v })} />
            <div>
              <div className="text-foreground mb-2 text-[13px] font-semibold">{t('superAdmin.f.facilityItems')}</div>
              <RepeatList
                items={d.items}
                onChange={(items) => set({ ...d, items })}
                makeEmpty={emptyL}
                addLabel={t('superAdmin.f.addFacility')}
                itemLabel={(i) => t('superAdmin.f.facilityN', { n: i + 1 })}
                emptyText={t('superAdmin.f.facilityEmpty')}
                renderItem={(item, update, i) => (
                  <BilingualField label={t('superAdmin.f.facilityN', { n: i + 1 })} value={item} onChange={update} />
                )}
              />
            </div>
          </>
        )}
      />
    </ContentPage>
  );
}
