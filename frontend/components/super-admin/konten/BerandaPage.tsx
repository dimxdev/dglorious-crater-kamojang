'use client';

import { CollectionEditor } from '@/components/super-admin/cms/CollectionEditor';
import { SectionCard } from '@/components/super-admin/cms/SectionEditor';
import { BilingualField, IconPicker, ImageField, TextField, emptyL } from '@/components/super-admin/cms/controls';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ContentPage, optionalL, useCollectionText, useSectionText } from './shared';

export function BerandaPage() {
  const { t } = useTranslation();
  const s = useSectionText();
  const c = useCollectionText();
  const toc = [
    { id: 's-home_hero', label: s('home_hero').title },
    { id: 's-home_attractions', label: s('home_attractions').title },
    { id: 's-home_facilities_teaser', label: s('home_facilities_teaser').title },
    { id: 's-home_lodging', label: s('home_lodging').title },
    { id: 's-home_info', label: s('home_info').title },
    { id: 'c-INFO_CARD', label: c('INFO_CARD').title },
    { id: 's-home_routes', label: s('home_routes').title },
    { id: 'c-ROUTE', label: c('ROUTE').title },
    { id: 's-home_faq', label: s('home_faq').title },
    { id: 'c-FAQ', label: c('FAQ').title },
    { id: 's-home_cta', label: s('home_cta').title },
  ];

  return (
    <ContentPage title={t('superAdmin.nav.home')} descriptionKey="superAdmin.pages.home" viewHref="/" toc={toc}>
      <SectionCard sectionKey="home_hero" {...s('home_hero')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.subtitle')} value={draft.subtitle} multiline rows={3} onChange={(v) => patch({ subtitle: v })} />
            <ImageField label={t('superAdmin.f.heroImage')} value={draft.imageUrl || null} onChange={(url) => patch({ imageUrl: url })} />
          </>
        )}
      </SectionCard>

      <SectionCard sectionKey="home_attractions" {...s('home_attractions')}>
        {({ draft, patch }) => (
          <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
        )}
      </SectionCard>

      <SectionCard sectionKey="home_facilities_teaser" {...s('home_facilities_teaser')}>
        {({ draft, patch }) => (
          <BilingualField label={t('superAdmin.f.body')} value={draft.body} multiline rows={4} onChange={(v) => patch({ body: v })} />
        )}
      </SectionCard>

      <SectionCard sectionKey="home_lodging" {...s('home_lodging')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.subtitle')} value={draft.subtitle} multiline rows={3} onChange={(v) => patch({ subtitle: v })} />
          </>
        )}
      </SectionCard>

      <SectionCard sectionKey="home_info" {...s('home_info')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <ImageField label={t('superAdmin.f.locationPhoto')} value={draft.imageUrl || null} onChange={(url) => patch({ imageUrl: url })} />
          </>
        )}
      </SectionCard>

      <CollectionEditor
        collection="INFO_CARD"
        {...c('INFO_CARD')}
        makeEmpty={() => ({ icon: 'Info', title: emptyL(), line1: emptyL(), line2: emptyL() })}
        summarize={(x) => ({ title: x.title, meta: [x.line1.id, x.line2.id].filter(Boolean).join(' · ') })}
        renderForm={(d, set) => (
          <>
            <IconPicker label={t('superAdmin.f.icon')} value={d.icon} onChange={(icon) => set({ ...d, icon })} />
            <BilingualField label={t('superAdmin.f.title')} value={d.title} onChange={(v) => set({ ...d, title: v })} />
            <BilingualField label={t('superAdmin.f.line1')} value={d.line1} onChange={(v) => set({ ...d, line1: v })} />
            <BilingualField label={t('superAdmin.f.line2')} value={d.line2} onChange={(v) => set({ ...d, line2: v })} />
            <BilingualField
              label={t('superAdmin.f.linkLabel')}
              hint={t('superAdmin.f.optional')}
              value={d.linkLabel ?? emptyL()}
              onChange={(v) => set(optionalL(d, 'linkLabel', v))}
            />
            <TextField
              label={t('superAdmin.f.href')}
              hint={t('superAdmin.f.hrefHint')}
              inputMode="url"
              value={d.href ?? ''}
              onChange={(v) => {
                const next = { ...d };
                if (v.trim() === '') delete next.href;
                else next.href = v;
                set(next);
              }}
            />
          </>
        )}
      />

      <SectionCard sectionKey="home_routes" {...s('home_routes')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.lead')} value={draft.lead} multiline rows={3} onChange={(v) => patch({ lead: v })} />
            <TextField label={t('superAdmin.f.mapsUrl')} hint={t('superAdmin.f.mapsUrlHint')} inputMode="url" value={draft.mapsUrl} onChange={(v) => patch({ mapsUrl: v })} />
          </>
        )}
      </SectionCard>

      <CollectionEditor
        collection="ROUTE"
        {...c('ROUTE')}
        makeEmpty={() => ({ from: emptyL(), duration: emptyL(), distance: emptyL(), note: emptyL() })}
        summarize={(x) => ({ title: x.from, meta: [x.duration.id, x.distance.id].filter(Boolean).join(' · ') })}
        renderForm={(d, set) => (
          <>
            <BilingualField label={t('superAdmin.f.from')} value={d.from} onChange={(v) => set({ ...d, from: v })} />
            <BilingualField label={t('superAdmin.f.duration')} value={d.duration} onChange={(v) => set({ ...d, duration: v })} />
            <BilingualField label={t('superAdmin.f.distance')} value={d.distance} onChange={(v) => set({ ...d, distance: v })} />
            <BilingualField label={t('superAdmin.f.note')} value={d.note} multiline rows={3} onChange={(v) => set({ ...d, note: v })} />
          </>
        )}
      />

      <SectionCard sectionKey="home_faq" {...s('home_faq')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.lead')} value={draft.lead} multiline rows={3} onChange={(v) => patch({ lead: v })} />
          </>
        )}
      </SectionCard>

      <CollectionEditor
        collection="FAQ"
        {...c('FAQ')}
        makeEmpty={() => ({ q: emptyL(), a: emptyL() })}
        summarize={(x) => ({ title: x.q })}
        renderForm={(d, set) => (
          <>
            <BilingualField label={t('superAdmin.f.question')} value={d.q} onChange={(v) => set({ ...d, q: v })} />
            <BilingualField label={t('superAdmin.f.answer')} value={d.a} multiline rows={5} onChange={(v) => set({ ...d, a: v })} />
          </>
        )}
      />

      <SectionCard sectionKey="home_cta" {...s('home_cta')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.subtitle')} value={draft.subtitle} multiline rows={3} onChange={(v) => patch({ subtitle: v })} />
            <ImageField label={t('superAdmin.f.backgroundImage')} value={draft.imageUrl || null} onChange={(url) => patch({ imageUrl: url })} />
          </>
        )}
      </SectionCard>
    </ContentPage>
  );
}
