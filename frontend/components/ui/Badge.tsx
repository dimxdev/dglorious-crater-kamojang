import { cn } from '@/lib/cn';

type Tone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'forest'
  | 'terracotta';

const tones: Record<Tone, string> = {
  neutral: 'bg-cream-200 text-foreground',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-sky-100 text-sky-800',
  danger: 'bg-red-100 text-red-700',
  forest: 'bg-forest-100 text-forest-800',
  terracotta: 'bg-terracotta-100 text-terracotta-700',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Pemetaan status booking → tone badge (dipakai di tabel booking). */
export const bookingStatusTone: Record<string, Tone> = {
  PENDING: 'neutral',
  WAITING_PAYMENT: 'warning',
  PAID: 'info',
  CONFIRMED: 'success',
  CHECKED_IN: 'forest',
  COMPLETED: 'forest',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
  REJECTED: 'danger',
};
