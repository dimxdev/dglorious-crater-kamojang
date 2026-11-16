'use client';

import { SectionCard } from '@/components/super-admin/cms/SectionEditor';
import { BilingualField, TextField } from '@/components/super-admin/cms/controls';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ContentPage, useSectionText } from './shared';

export function KontakPage() {
  const { t } = useTranslation();
  const s = useSectionText();
  return (
    <ContentPage title={t('superAdmin.nav.contact')} descriptionKey="superAdmin.pages.contact" viewHref="/" toc={[]}>
      <SectionCard sectionKey="contact" {...s('contact')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.address')} value={draft.address} multiline rows={3} onChange={(v) => patch({ address: v })} />
            <TextField
              label={t('superAdmin.f.mapsQuery')}
              hint={t('superAdmin.f.mapsQueryHint')}
              value={draft.mapsQuery}
              onChange={(v) => patch({ mapsQuery: v })}
            />
            <BilingualField label={t('superAdmin.f.footerTagline')} value={draft.footerTagline} multiline rows={3} onChange={(v) => patch({ footerTagline: v })} />

            <fieldset className="rounded-xl border border-[#ece6d8] bg-[#fbf9f4] p-4">
              <legend className="text-foreground px-1.5 text-[13px] font-semibold">{t('superAdmin.f.waLegend')}</legend>
              <p className="text-muted mb-4 text-[12.5px] leading-snug">{t('superAdmin.f.waIntro')}</p>
              <div className="flex flex-col gap-5">
                <BilingualField
                  label={t('superAdmin.f.waGeneral')}
                  value={draft.waMessages.general}
                  multiline
                  rows={2}
                  onChange={(v) => patch({ waMessages: { ...draft.waMessages, general: v } })}
                />
                <BilingualField
                  label={t('superAdmin.f.waBooking')}
                  value={draft.waMessages.booking}
                  multiline
                  rows={2}
                  onChange={(v) => patch({ waMessages: { ...draft.waMessages, booking: v } })}
                />
                <BilingualField
                  label={t('superAdmin.f.waRoom')}
                  hint={t('superAdmin.f.waRoomHint')}
                  value={draft.waMessages.room}
                  multiline
                  rows={2}
                  onChange={(v) => patch({ waMessages: { ...draft.waMessages, room: v } })}
                />
                <BilingualField
                  label={t('superAdmin.f.waTerms')}
                  value={draft.waMessages.terms}
                  multiline
                  rows={2}
                  onChange={(v) => patch({ waMessages: { ...draft.waMessages, terms: v } })}
                />
              </div>
            </fieldset>
          </>
        )}
      </SectionCard>

      <SectionCard sectionKey="site_meta" {...s('site_meta')}>
        {({ draft, patch }) => (
          <BilingualField
            label={t('superAdmin.f.metaDescription')}
            hint={t('superAdmin.f.metaHint')}
            value={draft.description}
            multiline
            rows={3}
            onChange={(v) => patch({ description: v })}
          />
        )}
      </SectionCard>
    </ContentPage>
  );
}
