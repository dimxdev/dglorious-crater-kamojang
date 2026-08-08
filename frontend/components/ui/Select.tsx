'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

type Option = { value: string; label: string };

type SelectProps = {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
  value?: string;
  /** Bentuk `{ target: { value } }` sengaja disamain sama event native `<select>`
   *  — biar semua caller yang sudah ada (`onChange={(e) => setX(e.target.value)}`)
   *  gak perlu diubah walau di dalam sekarang dijalanin Radix (`onValueChange`). */
  onChange?: (e: { target: { value: string } }) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

/**
 * Dropdown custom berbasis Radix UI (`@radix-ui/react-select`) — bukan native
 * `<select>`. Trigger tertutup sudah lama di-style manual, tapi popup daftar
 * pilihannya dulu rendering native browser (gak bisa di-custom lewat CSS).
 * Radix nanganin keyboard nav/focus/ARIA/posisi popup, styling popup-nya
 * tetap Tailwind manual biar konsisten sama brand.
 */
export function Select({
  label,
  error,
  options,
  placeholder,
  value,
  onChange,
  name,
  disabled,
  className,
  id,
}: SelectProps) {
  const selectId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        onValueChange={(v) => onChange?.({ target: { value: v } })}
        name={name}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={selectId}
          className={cn(
            'border-input flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border bg-white px-3.5 text-sm',
            'focus:border-forest-500 focus:ring-forest-500/20 focus:ring-2 focus:outline-none',
            'disabled:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-60',
            'data-[placeholder]:text-muted/60',
            error && 'border-red-500',
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown size={16} strokeWidth={1.75} className="text-muted shrink-0" aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="border-border z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[10px] border bg-white shadow-lg"
          >
            <SelectPrimitive.Viewport className="max-h-72 p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    'relative flex cursor-pointer items-center rounded-lg py-2 pr-8 pl-3 text-sm outline-none select-none',
                    'data-[highlighted]:bg-green-50 data-[highlighted]:text-green-800',
                    'data-[state=checked]:text-green-700 data-[state=checked]:font-semibold',
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
                    <Check size={15} strokeWidth={2} aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
