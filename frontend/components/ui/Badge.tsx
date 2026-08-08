import { cn } from '@/lib/cn';

type Tone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'forest'
  | 'terracotta';

// Dot-indicator + teks polos (bukan pill berwarna) — pola pill pastel
// generik (bg-emerald-100 dkk) gampang kebaca sebagai "template dashboard
// AI-generated" & gak match sama palet brand (hijau/biru/oranye). Dot warna
// tetap kasih sinyal cepat buat scan tabel, tanpa kesan kapsul-kapsul
// berwarna yang berat.
const dotTones: Record<Tone, string> = {
  neutral: 'bg-stone-400',
  success: 'bg-green-600',
  warning: 'bg-orange-400',
  info: 'bg-blue-500',
  danger: 'bg-red-500',
  forest: 'bg-green-800',
  terracotta: 'bg-orange-600',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn('text-foreground inline-flex items-center gap-1.5 text-[12.5px] font-medium', className)}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotTones[tone])} aria-hidden />
      {children}
    </span>
  );
}
