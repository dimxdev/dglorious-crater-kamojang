import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({
  label,
  error,
  className,
  id,
  type,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  // Native `type="date"` udah cukup bagus buat UX (keyboard OS, aksesibilitas) —
  // gak perlu diganti custom calendar widget, cukup dikasih ikon depan biar
  // gak keliatan input polos tanpa konteks.
  const isDate = type === 'date';
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-foreground text-sm font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {isDate && (
          <CalendarDays
            size={16}
            strokeWidth={1.75}
            className="text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
            aria-hidden
          />
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'border-input h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm',
            isDate && 'pl-9.5',
            'placeholder:text-muted/60',
            'focus:border-forest-500 focus:ring-forest-500/20 focus:ring-2 focus:outline-none',
            'disabled:bg-cream-100 disabled:opacity-60',
            error &&
              'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
