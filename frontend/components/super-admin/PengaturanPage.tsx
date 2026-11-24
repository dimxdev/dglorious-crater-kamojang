'use client';

import { Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { fetchAdminSettings, updateSettings } from '@/lib/api/siteContent';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { CardShell, ErrorBlock, LoadingBlock } from './cms/SectionEditor';
import { LangPill, fieldClass, ghostBtn, textareaClass } from './cms/controls';
import { useReportDirty } from './cms/dirty';
import { isInvalidPhone, normalizeIdPhone } from '@/lib/phone';
import { errorMessage, isEmail, isHttpsUrl } from '@/lib/validation';
import { SuperAdminLayout } from './SuperAdminLayout';

const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const MAX_TERMS = 20000;

/** Pesan galat satu kolom pengaturan, null kalau valid (kolom kosong dibolehkan). */
function settingError(key: string, kind: Kind, value: string, t: (k: string) => string): string | null {
  const v = value.trim();
  if (kind === 'time') return TIME_RE.test(v) ? null : t('validation.timeInvalid');
  if (v === '') return null;
  if (kind === 'tel') return isInvalidPhone(v) ? t('admin.invalidPhone') : null;
  if (kind === 'email') return isEmail(v) ? null : t('validation.emailInvalid');
  if (kind === 'url') return isHttpsUrl(v) ? null : t('validation.httpsOnly');
  if (kind === 'multiline') return v.length > MAX_TERMS ? t('validation.textTooLong') : null;
  void key;
  return v.length > 500 ? t('validation.textTooLong') : null;
}

type Kind = 'text' | 'time' | 'multiline' | 'url' | 'email' | 'tel';
type KnownKey = { key: string; kind: Kind; lang?: 'id' | 'en' };

// Urutan tampil per grup. Key yang tidak terdaftar di sini jatuh ke grup "Lainnya".
const GROUPS: { id: string; keys: KnownKey[] }[] = [
  {
    id: 'contact',
    keys: [
      { key: 'whatsapp_number', kind: 'tel' },
      { key: 'whatsapp_number_2', kind: 'tel' },
      { key: 'contact_email', kind: 'email' },
    ],
  },
  {
    id: 'social',
    keys: [
      { key: 'instagram_url', kind: 'url' },
      { key: 'tiktok_url', kind: 'url' },
      { key: 'facebook_url', kind: 'url' },
    ],
  },
  {
    id: 'hours',
    keys: [
      { key: 'check_in_time', kind: 'time' },
      { key: 'check_out_time', kind: 'time' },
    ],
  },
  {
    id: 'terms',
    keys: [
      { key: 'terms_conditions_id', kind: 'multiline', lang: 'id' },
      { key: 'terms_conditions_en', kind: 'multiline', lang: 'en' },
    ],
  },
];

const KNOWN = new Map(GROUPS.flatMap((g) => g.keys.map((k) => [k.key, k] as const)));

export function PengaturanPage() {
  const { t } = useTranslation();
  return (
    <SuperAdminLayout
      group={t('superAdmin.nav.groupSystem')}
      title={t('superAdmin.nav.settings')}
      description={t('superAdmin.settings.desc')}
    >
      <SettingsForm />
    </SuperAdminLayout>
  );
}

// Terpisah dari layout supaya `useReportDirty` hidup di bawah DirtyProvider milik layout.
function SettingsForm() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [saved, setSaved] = useState<Record<string, string> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAdminSettings(token)
      .then((v) => {
        if (cancelled) return;
        setSaved(v);
        setDraft(v);
        setLoadError(null);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : t('superAdmin.cms.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [token, nonce, t]);

  useEffect(() => {
    if (!justSaved) return;
    const id = window.setTimeout(() => setJustSaved(false), 4000);
    return () => window.clearTimeout(id);
  }, [justSaved]);

  const changedKeys = useMemo(
    () => (saved ? Object.keys(saved).filter((k) => draft[k] !== saved[k]) : []),
    [saved, draft],
  );
  const dirty = changedKeys.length > 0;
  const fieldErrors = useMemo(() => {
    const out: Record<string, string> = {};
    if (!saved) return out;
    for (const key of Object.keys(draft)) {
      const kind = KNOWN.get(key)?.kind ?? 'text';
      const msg = settingError(key, kind, draft[key] ?? '', t);
      if (msg) out[key] = msg;
    }
    return out;
  }, [draft, saved, t]);
  const hasFieldError = changedKeys.some((k) => fieldErrors[k]);
  useReportDirty('settings', dirty);

  const otherKeys = useMemo(() => (saved ? Object.keys(saved).filter((k) => !KNOWN.has(k)).sort() : []), [saved]);

  function setValue(key: string, value: string) {
    setJustSaved(false);
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    if (!token || !dirty || saving || hasFieldError) return;
    setSaving(true);
    setSaveError(null);
    try {
      const values = Object.fromEntries(
        changedKeys.map((k) => {
          const raw = (draft[k] ?? '').trim();
          const kind = KNOWN.get(k)?.kind;
          return [k, kind === 'tel' && raw ? (normalizeIdPhone(raw) ?? raw) : kind === 'multiline' ? draft[k] : raw];
        }),
      );
      const next = await updateSettings(token, values);
      setSaved(next);
      setDraft(next);
      setJustSaved(true);
    } catch (e) {
      setSaveError(errorMessage(e, t('admin.saveError')));
    } finally {
      setSaving(false);
    }
  }

  function labelFor(key: string) {
    const k = `superAdmin.settings.label.${key}`;
    const v = t(k);
    return v === k ? key : v;
  }
  function hintFor(key: string) {
    const k = `superAdmin.settings.hint.${key}`;
    const v = t(k);
    return v === k ? undefined : v;
  }

  function renderField(key: string, kind: Kind, lang?: 'id' | 'en') {
    const id = `setting-${key}`;
    const value = draft[key] ?? '';
    return (
      <div key={key}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <label htmlFor={id} className="text-foreground text-[13px] font-semibold">
            {labelFor(key)}
          </label>
          {lang && <LangPill lang={lang} />}
        </div>
        {hintFor(key) && <p className="text-muted -mt-0.5 mb-1.5 text-[12px] leading-snug">{hintFor(key)}</p>}
        {kind === 'multiline' ? (
          <textarea
            id={id}
            lang={lang}
            rows={12}
            value={value}
            maxLength={MAX_TERMS}
            onChange={(e) => setValue(key, e.target.value)}
            className={textareaClass}
          />
        ) : (
          <input
            id={id}
            type={kind === 'tel' ? 'tel' : kind === 'email' ? 'email' : kind === 'time' ? 'time' : kind === 'url' ? 'url' : 'text'}
            inputMode={kind === 'tel' ? 'tel' : undefined}
            maxLength={kind === 'tel' ? 25 : 500}
            placeholder={kind === 'url' ? 'https://' : kind === 'tel' ? '0812-3456-7890' : undefined}
            aria-invalid={fieldErrors[key] ? true : undefined}
            aria-describedby={fieldErrors[key] ? `${id}-err` : undefined}
            value={value}
            onChange={(e) => setValue(key, e.target.value)}
            className={`${fieldClass} ${kind === 'time' ? 'sm:max-w-48' : ''} ${fieldErrors[key] ? 'border-red-600' : ''}`}
          />
        )}
        {fieldErrors[key] ? (
          <p id={`${id}-err`} role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-700">
            {fieldErrors[key]}
          </p>
        ) : kind === 'tel' && normalizeIdPhone(value) ? (
          <p className="text-muted mt-1.5 text-[12px]">
            {t('validation.phoneSavedAs', { phone: normalizeIdPhone(value) ?? '' })}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {loadError && <ErrorBlock message={loadError} onRetry={() => { setLoadError(null); setNonce((n) => n + 1); }} />}
      {!loadError && !saved && <LoadingBlock label={t('superAdmin.cms.loading')} />}
      {saved && (
        <div className="flex flex-col gap-6">
          {GROUPS.map((g) => {
            const present = g.keys.filter((k) => k.key in saved);
            if (present.length === 0) return null;
            return (
              <CardShell
                key={g.id}
                title={t(`superAdmin.settings.group.${g.id}.title`)}
                description={t(`superAdmin.settings.group.${g.id}.desc`)}
              >
                <div className="flex flex-col gap-5">{present.map((k) => renderField(k.key, k.kind, k.lang))}</div>
              </CardShell>
            );
          })}
          {otherKeys.length > 0 && (
            <CardShell title={t('superAdmin.settings.group.other.title')} description={t('superAdmin.settings.group.other.desc')}>
              <div className="flex flex-col gap-5">{otherKeys.map((k) => renderField(k, 'text'))}</div>
            </CardShell>
          )}

          <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-[#ece6d8] bg-white px-4 py-2.5 sm:px-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)]">
            <p role="status" className="min-w-0 truncate text-[12.5px]">
              {dirty ? (
                <span className="text-foreground inline-flex items-center gap-2 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
                  {t('superAdmin.settings.changedCount', { n: changedKeys.length })}
                </span>
              ) : justSaved ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-green-800">
                  <Check size={14} strokeWidth={2.5} aria-hidden />
                  {t('superAdmin.cms.saved')}
                </span>
              ) : (
                <span className="text-muted">{t('superAdmin.settings.noChanges')}</span>
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
                    setSaveError(null);
                  }}
                >
                  <span className="sm:hidden">{t('admin.cancel')}</span>
                  <span className="hidden sm:inline">{t('superAdmin.cms.discard')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void save()}
                disabled={!dirty || saving || hasFieldError}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-green-700 px-4 text-[13.5px] sm:h-10 sm:px-5 font-semibold text-white transition-colors hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              >
                {saving ? t('superAdmin.cms.saving') : t('superAdmin.cms.save')}
              </button>
            </div>
          </div>
          {saveError && <ErrorBlock message={saveError} />}
        </div>
      )}
    </>
  );
}
