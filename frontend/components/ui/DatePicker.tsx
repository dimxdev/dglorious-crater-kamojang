import { cn } from '@/lib/cn';

type DatePickerProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label?: string;
  error?: string;
};

/**
 * DatePicker dasar berbasis input native (type="date").
 * Untuk widget booking (FASE 4/5) — menandai tanggal penuh sebagai disabled —
 * komponen ini akan ditingkatkan menjadi kalender kustom.
 */
export function DatePicker({
  label,
  error,
  className,
  id,
  ...props
}: DatePickerProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      <input
        type="date"
        id={inputId}
        className={cn(
          'border-input h-11 rounded-[10px] border bg-white px-3.5 text-sm',
          'focus:border-forest-500 focus:ring-forest-500/20 focus:ring-2 focus:outline-none',
          'disabled:bg-cream-100 disabled:opacity-60',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
