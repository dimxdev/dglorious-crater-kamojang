'use client';

import { CollectionEditor } from '@/components/super-admin/cms/CollectionEditor';
import { SectionCard } from '@/components/super-admin/cms/SectionEditor';
import { BilingualField, emptyL } from '@/components/super-admin/cms/controls';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ContentPage, useCollectionText, useSectionText } from './shared';

export function GaleriPage() {
  const { t } = useTranslation();
  const s = useSectionText();
  const c = useCollectionText();
  return (
    <ContentPage title={t('superAdmin.nav.gallery')} descriptionKey="superAdmin.pages.gallery" viewHref="/tentang" toc={[]}>
      <SectionCard sectionKey="about_gallery" {...s('about_gallery')}>
        {({ draft, patch }) => (
          <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
        )}
      </SectionCard>

      <CollectionEditor
        collection="GALLERY"
        {...c('GALLERY')}
        hasImage
        imageLabel={t('superAdmin.f.photo')}
        makeEmpty={() => ({ label: emptyL() })}
        summarize={(x) => ({ title: x.label })}
        renderForm={(d, set) => (
          <BilingualField label={t('superAdmin.f.caption')} value={d.label} onChange={(v) => set({ ...d, label: v })} />
        )}
      />
    </ContentPage>
  );
}
