import { cn } from '@/lib/cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'border-input h-11 rounded-[10px] border bg-white px-3.5 text-sm',
          'placeholder:text-muted/60',
          'focus:border-forest-500 focus:ring-forest-500/20 focus:ring-2 focus:outline-none',
          'disabled:bg-cream-100 disabled:opacity-60',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
