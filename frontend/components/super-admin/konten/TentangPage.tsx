'use client';

import { SectionCard } from '@/components/super-admin/cms/SectionEditor';
import { BilingualField, ImageField, RepeatList, emptyL } from '@/components/super-admin/cms/controls';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ContentPage, useSectionText } from './shared';

export function TentangPage() {
  const { t } = useTranslation();
  const s = useSectionText();
  return (
    <ContentPage title={t('superAdmin.nav.about')} descriptionKey="superAdmin.pages.about" viewHref="/tentang" toc={[]}>
      <SectionCard sectionKey="about_intro" {...s('about_intro')}>
        {({ draft, patch }) => (
          <>
            <BilingualField label={t('superAdmin.f.title')} value={draft.title} onChange={(v) => patch({ title: v })} />
            <BilingualField label={t('superAdmin.f.lead')} value={draft.lead} multiline rows={4} onChange={(v) => patch({ lead: v })} />
            <div>
              <div className="text-foreground text-[13px] font-semibold">{t('superAdmin.f.stats')}</div>
              <p className="text-muted mt-0.5 mb-3 text-[12px]">{t('superAdmin.f.statsHint')}</p>
              <RepeatList
                items={draft.stats}
                onChange={(stats) => patch({ stats })}
                max={4}
                makeEmpty={() => ({ label: emptyL(), value: emptyL() })}
                addLabel={t('superAdmin.f.addStat')}
                itemLabel={(i) => t('superAdmin.f.statN', { n: i + 1 })}
                emptyText={t('superAdmin.f.statsEmpty')}
                renderItem={(item, update) => (
                  <div className="flex flex-col gap-4">
                    <BilingualField label={t('superAdmin.f.statValue')} value={item.value} onChange={(v) => update({ ...item, value: v })} />
                    <BilingualField label={t('superAdmin.f.statLabel')} value={item.label} onChange={(v) => update({ ...item, label: v })} />
                  </div>
                )}
              />
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard sectionKey="about_history" {...s('about_history')}>
        {({ draft, patch }) => (
          <>
            <BilingualField
              label={t('superAdmin.f.body')}
              hint={t('superAdmin.f.paragraphHint')}
              value={draft.body}
              multiline
              rows={9}
              onChange={(v) => patch({ body: v })}
            />
            <ImageField label={t('superAdmin.f.photo')} value={draft.imageUrl || null} onChange={(url) => patch({ imageUrl: url })} />
          </>
        )}
      </SectionCard>
    </ContentPage>
  );
}
