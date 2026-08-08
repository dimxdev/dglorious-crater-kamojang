'use client';

import { Plus, X } from 'lucide-react';
import { Input, Select } from '@/components/ui';
import type { RoomType } from '@/lib/data/rooms';
import { formatIDR } from '@/lib/format';
import {
  calcGroupSubtotal,
  calcGroupsTotal,
  type ExtraBedType,
} from '@/lib/pricing';

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
  rooms: RoomType[];
  checkIn: string;
  checkOut: string;
  labels: Labels;
};

/** Editor grup tenda per booking: tiap grup = tipe + jumlah unit + dewasa/anak/extra bed-nya sendiri, plus subtotal harga real-time. */
export function RoomGroupEditor({
  value,
  onChange,
  rooms,
  checkIn,
  checkOut,
  labels,
}: RoomGroupEditorProps) {
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
          <div key={i} className="border-input relative rounded-xl border p-4">
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Hapus grup tenda"
                className="text-muted absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
              </button>
            )}
            <div className="grid grid-cols-2 gap-3 pr-8 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-3">
                <Select
                  label={labels.roomLabel}
                  value={group.slug}
                  onChange={(e) => update(i, { slug: e.target.value })}
                  options={options}
                />
              </div>
              <Input
                label={labels.adultsLabel}
                type="number"
                min={1}
                value={group.adults}
                onChange={(e) =>
                  update(i, {
                    adults: Math.max(1, Number(e.target.value) || 1),
                  })
                }
              />
              <Input
                label={labels.childrenLabel}
                type="number"
                min={0}
                value={group.children}
                onChange={(e) =>
                  update(i, { children: Number(e.target.value) || 0 })
                }
              />
              <Input
                label={labels.extraBedQtyLabel}
                type="number"
                min={0}
                value={group.extraBedQty}
                onChange={(e) =>
                  update(i, { extraBedQty: Number(e.target.value) || 0 })
                }
              />
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
        className="border-input text-muted-strong flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-sm font-medium transition-colors hover:border-green-500 hover:text-green-700"
      >
        <Plus size={16} strokeWidth={1.75} aria-hidden />
        {labels.addLabel}
      </button>

      <div className="border-border flex items-center justify-between border-t pt-3 text-base font-bold">
        <span>{labels.totalLabel}</span>
        <span className="text-green-700">{formatIDR(grandTotal)}</span>
      </div>
    </div>
  );
}
