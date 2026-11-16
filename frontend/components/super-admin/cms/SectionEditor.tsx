'use client';

import { Check } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  type AdminSection,
  type SectionKey,
  type SiteSections,
  fetchAdminSections,
  updateSection,
} from '@/lib/api/siteContent';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ghostBtn } from './controls';
import { useReportDirty } from './dirty';

/* ── Satu kali fetch semua section per halaman ─────────────── */

type SectionsCtx = {
  sections: Map<SectionKey, AdminSection> | null;
  error: string | null;
  reload: () => void;
  put: (s: AdminSection) => void;
};

const SectionsContext = createContext<SectionsCtx | null>(null);

export function SectionsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [sections, setSections] = useState<Map<SectionKey, AdminSection> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAdminSections(token)
      .then((rows) => {
        if (cancelled) return;
        setError(null);
        setSections(new Map(rows.map((r) => [r.key, r])));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : t('superAdmin.cms.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [token, nonce, t]);

  const reload = useCallback(() => {
    setError(null);
    setSections(null);
    setNonce((n) => n + 1);
  }, []);

  const put = useCallback((s: AdminSection) => {
    setSections((prev) => (prev ? new Map(prev).set(s.key, s) : prev));
  }, []);

  const value = useMemo(() => ({ sections, error, reload, put }), [sections, error, reload, put]);
  return <SectionsContext.Provider value={value}>{children}</SectionsContext.Provider>;
}

/* ── Kartu: Shell dipakai juga oleh CollectionEditor ───────── */

export function CardShell({
  id,
  title,
  description,
  actions,
  children,
  footer,
}: {
  /** Anchor untuk daftar isi halaman. */
  id?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-[#ece6d8] bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f1ecdf] px-5 pt-5 pb-4 md:px-6">
        <div className="min-w-0 max-w-xl">
          <h2 className="text-forest-800 font-serif text-[19px] leading-snug font-bold">{title}</h2>
          {description && <p className="text-muted mt-1 text-[13px] leading-relaxed">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="px-5 py-5 md:px-6">{children}</div>
      {footer}
    </section>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div role="status" className="text-muted flex items-center gap-2.5 py-6 text-[13px]">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#d9d3c2] border-t-green-700 motion-reduce:animate-none" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="rounded-xl bg-red-50 px-4 py-3.5 text-[13px] text-red-800">
      <p className="font-medium">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={cn(ghostBtn, 'mt-1.5 -ml-2.5 text-red-800 hover:bg-red-100')}>
          {t('admin.retry')}
        </button>
      )}
    </div>
  );
}

/* ── Editor satu section ───────────────────────────────────── */

export type SectionFormApi<K extends SectionKey> = {
  draft: SiteSections[K];
  /** Ganti sebagian field (shallow merge). */
  patch: (p: Partial<SiteSections[K]>) => void;
};

export function SectionCard<K extends SectionKey>({
  sectionKey,
  title,
  description,
  children,
}: {
  sectionKey: K;
  title: string;
  description?: string;
  children: (api: SectionFormApi<K>) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const ctx = useContext(SectionsContext);
  if (!ctx) throw new Error('SectionCard harus di dalam <SectionsProvider>');
  const section = ctx.sections?.get(sectionKey) as AdminSection<K> | undefined;

  if (ctx.error) {
    return (
      <CardShell id={`s-${sectionKey}`} title={title} description={description}>
        <ErrorBlock message={ctx.error} onRetry={ctx.reload} />
      </CardShell>
    );
  }
  if (!ctx.sections) {
    return (
      <CardShell id={`s-${sectionKey}`} title={title} description={description}>
        <LoadingBlock label={t('superAdmin.cms.loading')} />
      </CardShell>
    );
  }
  if (!section) {
    return (
      <CardShell id={`s-${sectionKey}`} title={title} description={description}>
        <ErrorBlock message={t('superAdmin.cms.sectionMissing', { key: sectionKey })} />
      </CardShell>
    );
  }
  return (
    <SectionForm sectionKey={sectionKey} section={section} title={title} description={description} put={ctx.put}>
      {children}
    </SectionForm>
  );
}

function SectionForm<K extends SectionKey>({
  sectionKey,
  section,
  title,
  description,
  put,
  children,
}: {
  sectionKey: K;
  section: AdminSection<K>;
  title: string;
  description?: string;
  put: (s: AdminSection) => void;
  children: (api: SectionFormApi<K>) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [saved, setSaved] = useState(section.content);
  const [draft, setDraft] = useState(section.content);
  const [meta, setMeta] = useState({ updatedAt: section.updatedAt, by: section.updatedBy?.name ?? null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  useReportDirty(`section:${sectionKey}`, dirty);

  useEffect(() => {
    if (!justSaved) return;
    const id = window.setTimeout(() => setJustSaved(false), 4000);
    return () => window.clearTimeout(id);
  }, [justSaved]);

  const patch = useCallback((p: Partial<SiteSections[K]>) => {
    setJustSaved(false);
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  async function save() {
    if (!token || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateSection(token, sectionKey, draft);
      setSaved(res.content);
      setDraft(res.content);
      setMeta({ updatedAt: res.updatedAt, by: res.updatedBy?.name ?? null });
      put(res);
      setJustSaved(true);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const status = dirty
    ? t('superAdmin.cms.unsaved')
    : justSaved
      ? t('superAdmin.cms.saved')
      : t('superAdmin.cms.lastUpdated', { when: formatDateTime(meta.updatedAt) });
  const statusFull =
    !dirty && !justSaved && meta.by
      ? t('superAdmin.cms.lastUpdatedBy', { when: formatDateTime(meta.updatedAt), name: meta.by })
      : status;

  return (
    <CardShell
      id={`s-${sectionKey}`}
      title={title}
      description={description}
      footer={
        <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-2xl border-t border-[#ece6d8] bg-white px-4 py-2.5 sm:px-5 md:px-6">
          <p role="status" className="min-w-0 truncate text-[12.5px]">
            {dirty ? (
              <span className="text-foreground inline-flex items-center gap-2 font-semibold">
                <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
                {status}
              </span>
            ) : justSaved ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-green-800">
                <Check size={14} strokeWidth={2.5} aria-hidden />
                {status}
              </span>
            ) : (
              <>
                <span className="text-muted sm:hidden">{status}</span>
                <span className="text-muted hidden sm:inline">{statusFull}</span>
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {dirty && !saving && (
              <button
                type="button"
                aria-label={t('superAdmin.cms.discard')}
                className={ghostBtn}
                onClick={() => {
                  setDraft(saved);
                  setError(null);
                }}
              >
                <span className="sm:hidden">{t('admin.cancel')}</span>
                <span className="hidden sm:inline">{t('superAdmin.cms.discard')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || saving}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-green-700 px-4 text-[13.5px] sm:h-10 sm:px-5 font-semibold text-white transition-colors hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
            >
              {saving ? t('superAdmin.cms.saving') : t('superAdmin.cms.save')}
            </button>
          </div>
        </footer>
      }
    >
      <div className="flex flex-col gap-5">
        {children({ draft, patch })}
        {error && <ErrorBlock message={error} />}
      </div>
    </CardShell>
  );
}
