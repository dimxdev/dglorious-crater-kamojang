'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { icons, type IconName } from '@/lib/icons';

/** Satu baris fasilitas: ikon berlaku universal, label per-bahasa. */
export type FacilityRow = { icon: IconName; label: Record<string, string> };

const ALL_ICON_NAMES = Object.keys(icons) as IconName[];

type FacilityListEditorProps = {
  value: FacilityRow[];
  onChange: (rows: FacilityRow[]) => void;
  /** Kode bahasa tab yang sedang aktif — cuma label yang berubah per-tab. */
  lang: string;
  addLabel: string;
  labelPlaceholder: string;
};

/** Editor daftar fasilitas: tiap baris = tombol pilih ikon + input nama + hapus. */
export function FacilityListEditor({
  value,
  onChange,
  lang,
  addLabel,
  labelPlaceholder,
}: FacilityListEditorProps) {
  function updateIcon(index: number, icon: IconName) {
    onChange(value.map((row, i) => (i === index ? { ...row, icon } : row)));
  }
  function updateLabel(index: number, text: string) {
    onChange(
      value.map((row, i) =>
        i === index ? { ...row, label: { ...row.label, [lang]: text } } : row,
      ),
    );
  }
  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...value, { icon: 'Wifi', label: {} }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <IconPickerButton icon={row.icon} onSelect={(icon) => updateIcon(i, icon)} />
          <input
            value={row.label[lang] ?? ''}
            onChange={(e) => updateLabel(i, e.target.value)}
            placeholder={labelPlaceholder}
            className="border-input focus:border-forest-500 focus:ring-forest-500/20 h-10 flex-1 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="Hapus fasilitas"
            className="text-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg hover:bg-[#fdeceb] hover:text-[#b23b30]"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="border-input text-muted-strong hover:border-forest-500 hover:text-forest-700 mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-sm font-medium transition-colors"
      >
        <span aria-hidden>+</span>
        {addLabel}
      </button>
    </div>
  );
}

function IconPickerButton({
  icon,
  onSelect,
}: {
  icon: IconName;
  onSelect: (icon: IconName) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = icons[icon];

  // Tutup saat klik di luar — pola sama seperti LanguageSwitcher, hindari
  // race onBlur yang pernah bikin bug "klik opsi tidak jalan".
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-input hover:border-forest-500 flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon size={18} strokeWidth={1.5} aria-hidden />
      </button>

      {open && (
        <div
          className="border-border absolute top-full left-0 z-20 mt-1 grid w-66 grid-cols-7 gap-1 rounded-xl border bg-white p-2.5 shadow-lg"
          role="listbox"
        >
          {ALL_ICON_NAMES.map((name) => {
            const OptionIcon = icons[name];
            const selected = name === icon;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onSelect(name);
                  setOpen(false);
                }}
                title={name}
                aria-selected={selected}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                  selected
                    ? 'bg-forest-700 text-white'
                    : 'text-muted-strong hover:bg-cream-100',
                )}
              >
                <OptionIcon size={15} strokeWidth={1.5} aria-hidden />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
