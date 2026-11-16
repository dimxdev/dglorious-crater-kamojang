'use client';

import { SectionCard } from '@/components/super-admin/cms/SectionEditor';
import { BilingualField } from '@/components/super-admin/cms/controls';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ContentPage, useSectionText } from './shared';

export function HalamanPage() {
  const { t } = useTranslation();
  const s = useSectionText();
  return (
    <ContentPage title={t('superAdmin.nav.pages')} descriptionKey="superAdmin.pages.pages" viewHref="/penginapan" toc={[]}>
      <SectionCard sectionKey="listing" {...s('listing')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.lead')} value={draft.lead} multiline rows={3} onChange={(v) => patch({ lead: v })} />
            <BilingualField label={t('superAdmin.f.helpTitle')} value={draft.helpTitle} onChange={(v) => patch({ helpTitle: v })} />
            <BilingualField label={t('superAdmin.f.helpBody')} value={draft.helpBody} multiline rows={3} onChange={(v) => patch({ helpBody: v })} />
          </>
        )}
      </SectionCard>

      <SectionCard sectionKey="room_detail" {...s('room_detail')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.childrenRule')} value={draft.childrenRule} multiline rows={3} onChange={(v) => patch({ childrenRule: v })} />
            <BilingualField label={t('superAdmin.f.universalFacilitiesNote')} value={draft.universalFacilitiesNote} multiline rows={3} onChange={(v) => patch({ universalFacilitiesNote: v })} />
            <BilingualField label={t('superAdmin.f.priceNote')} value={draft.priceNote} multiline rows={3} onChange={(v) => patch({ priceNote: v })} />
          </>
        )}
      </SectionCard>

      <SectionCard sectionKey="terms" {...s('terms')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.subtitle')} value={draft.subtitle} multiline rows={2} onChange={(v) => patch({ subtitle: v })} />
            <BilingualField label={t('superAdmin.f.questionTitle')} value={draft.questionTitle} onChange={(v) => patch({ questionTitle: v })} />
            <BilingualField label={t('superAdmin.f.questionBody')} value={draft.questionBody} multiline rows={3} onChange={(v) => patch({ questionBody: v })} />
          </>
        )}
      </SectionCard>
    </ContentPage>
  );
}
