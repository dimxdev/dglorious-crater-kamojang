import { cn } from '@/lib/cn';

/**
 * Placeholder gambar bergaya brand (mengisi parent).
 * Dipakai selama foto asli belum diunggah — meniru "image slot" di desain.
 * Nanti diganti <Image> Next.js saat galeri/CMS aktif.
 */
export function ImagePlaceholder({
  label,
  icon = '🏞️',
  className,
}: {
  label?: string;
  icon?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'from-forest-700 to-forest-900 flex h-full w-full items-center justify-center bg-linear-to-br text-center',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1.5 p-4 text-cream-100/75">
        <span className="text-3xl opacity-90">{icon}</span>
        {label && <span className="text-xs font-medium">{label}</span>}
      </div>
    </div>
  );
}
