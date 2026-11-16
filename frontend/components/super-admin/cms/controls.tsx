'use client';

import { ArrowDown, ArrowUp, ImagePlus, Info, Plus, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { type Localized, resolveContentImage, uploadSiteImage } from '@/lib/api/siteContent';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { icons } from '@/lib/icons';

/* ── Gaya dasar ─────────────────────────────────────────────── */

// Border input digelapkan dari token `border-input` supaya batas kolom tetap
// terbaca (>= 3:1 terhadap putih) di atas kartu putih.
const fieldBase =
  'w-full rounded-[10px] border border-[#95917f] bg-white px-3.5 text-[14px] text-foreground ' +
  'placeholder:text-muted/70 focus:border-green-700 focus:ring-2 focus:ring-green-700/25 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-70';

export const fieldClass = cn(fieldBase, 'h-11');
export const textareaClass = cn(fieldBase, 'min-h-24 resize-y py-2.5 leading-relaxed');

export const ghostBtn =
  'inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-muted-strong ' +
  'transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

/* ── Label bahasa ───────────────────────────────────────────── */

export function LangPill({ lang }: { lang: 'id' | 'en' }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        lang === 'id' ? 'bg-green-50 text-green-800' : 'bg-sky-50 text-sky-800',
      )}
    >
      {lang === 'id' ? t('superAdmin.cms.langId') : t('superAdmin.cms.langEn')}
    </span>
  );
}

export function EnEmptyNotice() {
  const { t } = useTranslation();
  return (
    <p className="text-sulfur-700 mt-1.5 flex items-start gap-1.5 text-[12px] leading-snug">
      <Info size={13} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
      {t('superAdmin.cms.enEmpty')}
    </p>
  );
}

/* ── Field teks ─────────────────────────────────────────────── */

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-foreground text-[13px] font-semibold">
        {children}
      </label>
      {hint && <p className="text-muted mt-0.5 text-[12px] leading-snug">{hint}</p>}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  inputMode?: 'url' | 'text';
};

export function TextField({ label, hint, value, onChange, multiline, rows = 4, placeholder, inputMode }: TextFieldProps) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={textareaClass}
        />
      ) : (
        <input
          id={id}
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )}
    </div>
  );
}

/** Teks dwibahasa: ID dan EN berdampingan di desktop, bertumpuk di mobile. */
export function BilingualField({
  label,
  hint,
  value,
  onChange,
  multiline,
  rows = 4,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: Localized;
  onChange: (v: Localized) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: Localized;
}) {
  const idBase = useId();
  const groupId = `${idBase}-label`;
  const enEmpty = value.id.trim() !== '' && value.en.trim() === '';
  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div role="group" aria-labelledby={groupId}>
      <div className="mb-2">
        <div id={groupId} className="text-foreground text-[13px] font-semibold">
          {label}
        </div>
        {hint && <p className="text-muted mt-0.5 text-[12px] leading-snug">{hint}</p>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(['id', 'en'] as const).map((lang) => (
          <div key={lang}>
            <label htmlFor={`${idBase}-${lang}`} className="mb-1 flex items-center gap-1.5">
              <LangPill lang={lang} />
              <span className="sr-only">{label}</span>
            </label>
            <Tag
              id={`${idBase}-${lang}`}
              lang={lang}
              {...(multiline ? { rows } : {})}
              value={value[lang]}
              placeholder={placeholder?.[lang]}
              onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
                onChange({ ...value, [lang]: e.target.value })
              }
              className={multiline ? textareaClass : fieldClass}
            />
          </div>
        ))}
      </div>
      {enEmpty && <EnEmptyNotice />}
    </div>
  );
}

/* ── Harga (IDR) ────────────────────────────────────────────── */

export function PriceField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <div className="relative">
        <span
          className="text-muted-strong pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[13.5px] font-semibold"
          aria-hidden
        >
          Rp
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={value ? new Intl.NumberFormat('id-ID').format(value) : ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
            onChange(digits === '' ? 0 : Number(digits));
          }}
          className={cn(fieldClass, 'pl-10 tabular-nums')}
        />
      </div>
    </div>
  );
}

/* ── Switch ─────────────────────────────────────────────────── */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  hideLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  /** Label tetap jadi nama aksesibel, hanya disembunyikan secara visual. */
  hideLabel?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg text-[13px] font-medium text-foreground',
        'focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-green-700' : 'bg-[#8d8a7d]',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </span>
      <span className={cn(hideLabel && 'sr-only')}>{label}</span>
    </button>
  );
}

/* ── Pilih ikon ─────────────────────────────────────────────── */

const ICON_NAMES = Object.keys(icons);

export function IconPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const Current = (icons as Record<string, (typeof icons)[keyof typeof icons]>)[value];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Jangan ikut menutup modal induk (Modal mendengar Escape di window).
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef}>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(fieldClass, 'flex cursor-pointer items-center gap-2.5 text-left')}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-800">
          {Current ? <Current size={16} strokeWidth={1.75} aria-hidden /> : <span aria-hidden>?</span>}
        </span>
        <span className="flex-1 truncate">{value || t('superAdmin.cms.iconNone')}</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="mt-1.5 grid w-full max-w-[21rem] grid-cols-6 gap-1 rounded-xl border border-[#ece6d8] bg-[#fbf9f4] p-2 sm:grid-cols-7"
        >
          {ICON_NAMES.map((name) => {
            const Glyph = icons[name as keyof typeof icons];
            const selected = name === value;
            return (
              <button
                key={name}
                type="button"
                title={name}
                aria-label={name}
                aria-pressed={selected}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={cn(
                  'flex h-10 cursor-pointer items-center justify-center rounded-lg transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:outline-none',
                  selected ? 'bg-green-700 text-white' : 'text-muted-strong hover:bg-green-50',
                )}
              >
                <Glyph size={18} strokeWidth={1.75} aria-hidden />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Gambar ─────────────────────────────────────────────────── */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function ImageField({
  label,
  hint,
  value,
  onChange,
  allowClear,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (url: string) => void;
  /** Gambar opsional: tampilkan tombol hapus. */
  allowClear?: boolean;
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError(t('superAdmin.cms.imageNotImage'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t('superAdmin.cms.imageTooLarge'));
      return;
    }
    if (!token) return;
    setUploading(true);
    try {
      const { url } = await uploadSiteImage(token, file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('superAdmin.cms.imageUploadError'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <div className="flex flex-wrap items-start gap-4">
        <div className="aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-xl border border-[#ece6d8] bg-stone-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- pratinjau dari upload backend, bukan aset build
            <img
              src={resolveContentImage(value)}
              alt=""
              width={160}
              height={120}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-muted flex h-full flex-col items-center justify-center gap-1 text-[12px]">
              <ImagePlus size={20} strokeWidth={1.5} aria-hidden />
              {t('superAdmin.cms.imageNone')}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className={cn(ghostBtn, 'border border-[#95917f] bg-white')}
            >
              <ImagePlus size={15} strokeWidth={1.75} aria-hidden />
              {uploading
                ? t('superAdmin.cms.imageUploading')
                : value
                  ? t('superAdmin.cms.imageReplace')
                  : t('superAdmin.cms.imageUpload')}
            </button>
            {allowClear && value && (
              <button type="button" onClick={() => onChange('')} className={ghostBtn}>
                <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                {t('superAdmin.cms.imageRemove')}
              </button>
            )}
          </div>
          <p className="text-muted mt-2 text-[12px]">{t('superAdmin.cms.imageRule')}</p>
          {value && <p className="text-muted mt-1 text-[11.5px] break-all">{value}</p>}
          {error && (
            <p role="alert" className="mt-2 text-[12.5px] font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Daftar berulang (benefit, item fasilitas, statistik) ───── */

export function RepeatList<T>({
  items,
  onChange,
  renderItem,
  makeEmpty,
  addLabel,
  itemLabel,
  max,
  emptyText,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, update: (next: T) => void, index: number) => React.ReactNode;
  makeEmpty: () => T;
  addLabel: string;
  /** Nama aksesibel per baris, mis. "Benefit 2". */
  itemLabel: (index: number) => string;
  max?: number;
  emptyText?: string;
}) {
  const { t } = useTranslation();

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  }

  return (
    <div>
      {items.length === 0 && emptyText && <p className="text-muted mb-2 text-[13px]">{emptyText}</p>}
      <ol className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-xl border border-[#ece6d8] bg-[#fbf9f4] p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-muted-strong text-[12px] font-semibold">{itemLabel(i)}</span>
              <div className="flex items-center">
                <button
                  type="button"
                  className={ghostBtn}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  aria-label={t('superAdmin.cms.moveUpNamed', { name: itemLabel(i) })}
                >
                  <ArrowUp size={15} strokeWidth={1.75} aria-hidden />
                </button>
                <button
                  type="button"
                  className={ghostBtn}
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={t('superAdmin.cms.moveDownNamed', { name: itemLabel(i) })}
                >
                  <ArrowDown size={15} strokeWidth={1.75} aria-hidden />
                </button>
                <button
                  type="button"
                  className={cn(ghostBtn, 'text-red-700 hover:bg-red-50')}
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  aria-label={t('superAdmin.cms.removeNamed', { name: itemLabel(i) })}
                >
                  <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
            </div>
            {renderItem(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))), i)}
          </li>
        ))}
      </ol>
      {(max === undefined || items.length < max) && (
        <button
          type="button"
          onClick={() => onChange([...items, makeEmpty()])}
          className={cn(ghostBtn, 'mt-3 border border-dashed border-[#95917f]')}
        >
          <Plus size={15} strokeWidth={2} aria-hidden />
          {addLabel}
        </button>
      )}
    </div>
  );
}

export const emptyL = (): Localized => ({ id: '', en: '' });
