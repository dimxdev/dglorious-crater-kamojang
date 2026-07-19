import { cn } from '@/lib/cn';

type Option = { value: string; label: string };

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
};

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'border-input h-11 rounded-[10px] border bg-white px-3.5 text-sm',
          'focus:border-forest-500 focus:ring-forest-500/20 focus:ring-2 focus:outline-none',
          'disabled:bg-cream-100 disabled:opacity-60',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
