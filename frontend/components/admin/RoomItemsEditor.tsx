'use client';

import { Select } from '@/components/ui';

export type RoomItem = { slug: string; qty: number };

type Option = { value: string; label: string };

type RoomItemsEditorProps = {
  value: RoomItem[];
  onChange: (rows: RoomItem[]) => void;
  options: Option[];
  qtyLabel: string;
  addLabel: string;
};

/** Editor daftar tenda per booking: satu booking bisa mencakup ≥1 tipe tenda (PROJECT.md §10 `booking_items`). */
export function RoomItemsEditor({ value, onChange, options, qtyLabel, addLabel }: RoomItemsEditorProps) {
  function updateSlug(index: number, slug: string) {
    onChange(value.map((row, i) => (i === index ? { ...row, slug } : row)));
  }
  function updateQty(index: number, qty: number) {
    onChange(value.map((row, i) => (i === index ? { ...row, qty } : row)));
  }
  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function addRow() {
    const usedSlugs = new Set(value.map((row) => row.slug));
    const nextOption = options.find((opt) => !usedSlugs.has(opt.value)) ?? options[0];
    onChange([...value, { slug: nextOption?.value ?? '', qty: 1 }]);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {value.map((row, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              value={row.slug}
              onChange={(e) => updateSlug(i, e.target.value)}
              options={options}
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              min={1}
              value={row.qty}
              onChange={(e) => updateQty(i, Math.max(1, Number(e.target.value) || 1))}
              aria-label={qtyLabel}
              className="border-input focus:border-forest-500 focus:ring-forest-500/20 h-11 w-full rounded-[10px] border px-3 text-center text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          {value.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Hapus tenda"
              className="text-muted flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-lg hover:bg-[#fdeceb] hover:text-[#b23b30]"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="border-input text-muted-strong hover:border-forest-500 hover:text-forest-700 flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-sm font-medium transition-colors"
      >
        <span aria-hidden>+</span>
        {addLabel}
      </button>
    </div>
  );
}
