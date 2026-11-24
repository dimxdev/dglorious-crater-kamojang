'use client';

import { Copy, Plus, X } from 'lucide-react';
import { IntInput, Select } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { capacityErrors, LIMITS } from '@/lib/validation';
import type { BookableRoom } from '@/lib/pricing';
import { formatIDR } from '@/lib/format';
import {
  calcGroupSubtotal,
  calcGroupsTotal,
  type ExtraBedType,
} from '@/lib/pricing';

export type SlugAvailability =
  | { state: 'loading' }
  | { state: 'ok'; availableUnits: number; totalUnits: number }
  | { state: 'full' }
  | { state: 'error' };

export type RoomGroup = {
  slug: string;
  adults: number;
  children: number;
  extraBedQty: number;
  extraBedType: ExtraBedType;
};

type Labels = {
  roomLabel: string;
  adultsLabel: string;
  childrenLabel: string;
  extraBedQtyLabel: string;
  subtotalLabel: string;
  totalLabel: string;
  addLabel: string;
};

type RoomGroupEditorProps = {
  value: RoomGroup[];
  onChange: (groups: RoomGroup[]) => void;
  rooms: BookableRoom[];
  checkIn: string;
  checkOut: string;
  labels: Labels;
  availabilityBySlug?: Record<string, SlugAvailability>;
  /** Sembunyikan baris total di bawah — dipakai kalau totalnya sudah
   *  ditampilkan di panel ringkasan, biar gak dobel. */
  hideTotal?: boolean;
};

/** Editor grup tenda per reservasi: tiap grup = tipe + jumlah unit + dewasa/anak/extra bed-nya sendiri, plus subtotal harga real-time. */
export function RoomGroupEditor({
  value,
  onChange,
  rooms,
  checkIn,
  checkOut,
  labels,
  availabilityBySlug,
  hideTotal,
}: RoomGroupEditorProps) {
  const { t } = useTranslation();
  const capErrors = capacityErrors(value, rooms, t);
  const options = rooms.map((r) => ({
    value: r.slug,
    label: `${r.name} — ${r.category}`,
  }));

  function update(index: number, patch: Partial<RoomGroup>) {
    onChange(value.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }
  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function duplicate(index: number) {
    const next = [...value];
    next.splice(index + 1, 0, { ...value[index] });
    onChange(next);
  }
  function add() {
    onChange([
      ...value,
      {
        slug: rooms[0]?.slug ?? '',
        adults: 1,
        children: 0,
        extraBedQty: 0,
        extraBedType: 'with',
      },
    ]);
  }

  const grandTotal = calcGroupsTotal(rooms, value, checkIn, checkOut);

  return (
    <div className="flex flex-col gap-3">
      {value.map((group, i) => {
        const room = rooms.find((r) => r.slug === group.slug);
        const subtotal = calcGroupSubtotal(room, group, checkIn, checkOut);
        return (
          <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                Tenda {i + 1}
              </span>
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => duplicate(i)}
                  aria-label="Salin grup tenda"
                  className="text-muted flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:bg-green-50 hover:text-green-700"
                >
                  <Copy size={14} strokeWidth={1.75} aria-hidden />
                </button>
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="Hapus grup tenda"
                    className="text-muted flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={16} strokeWidth={1.75} aria-hidden />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-3">
                <Select
                  label={labels.roomLabel}
                  value={group.slug}
                  onChange={(e) => update(i, { slug: e.target.value })}
                  options={options}
                />
                {(() => {
                  const avail = availabilityBySlug?.[group.slug];
                  if (!avail) return null;
                  if (avail.state === 'loading')
                    return (
                      <p className="text-muted mt-1.5 text-[12px]">
                        Memeriksa ketersediaan...
                      </p>
                    );
                  if (avail.state === 'full')
                    return (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-red-600">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        Penuh — tidak tersedia untuk tanggal ini
                      </p>
                    );
                  if (avail.state === 'ok') {
                    // Kurangi unit yang sudah dipakai grup lain di form ini dengan slug yang sama
                    const otherSameSlugs = value.filter((g, j) => j !== i && g.slug === group.slug).length;
                    const effective = Math.max(0, avail.availableUnits - otherSameSlugs);
                    const isFull = effective === 0;
                    const isLow = effective === 1;
                    return (
                      <p
                        className={`mt-1.5 flex items-center gap-1.5 text-[12px] font-medium ${isFull ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-700'}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${isFull ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-green-500'}`}
                        />
                        {isFull
                          ? 'Penuh — tidak tersedia untuk tanggal ini'
                          : isLow
                            ? `1 dari ${avail.totalUnits} unit tersedia — hampir penuh`
                            : `${effective} dari ${avail.totalUnits} unit tersedia`}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              <IntInput
                label={labels.adultsLabel}
                value={group.adults}
                min={LIMITS.adults.min}
                max={LIMITS.adults.max}
                onValueChange={(n) => update(i, { adults: n })}
                className={capErrors[i] ? 'border-red-500' : undefined}
              />
              <IntInput
                label={labels.childrenLabel}
                value={group.children}
                min={LIMITS.children.min}
                max={LIMITS.children.max}
                onValueChange={(n) => update(i, { children: n })}
              />
              <IntInput
                label={labels.extraBedQtyLabel}
                value={group.extraBedQty}
                min={LIMITS.extraBed.min}
                max={LIMITS.extraBed.max}
                onValueChange={(n) => update(i, { extraBedQty: n })}
              />
              {capErrors[i] && (
                <p
                  role="alert"
                  className="col-span-2 text-[12.5px] font-medium text-red-600 sm:col-span-3"
                >
                  {capErrors[i]}
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 text-sm font-semibold text-green-700">
              {labels.subtotalLabel}
              <span>{formatIDR(subtotal)}</span>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-green-300 bg-green-50 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100"
      >
        <Plus size={16} strokeWidth={1.75} aria-hidden />
        {labels.addLabel}
      </button>

      {!hideTotal && (
        <div className="border-border flex items-center justify-between border-t pt-3 text-base font-bold">
          <span>{labels.totalLabel}</span>
          <span className="text-green-700">{formatIDR(grandTotal)}</span>
        </div>
      )}
    </div>
  );
}
