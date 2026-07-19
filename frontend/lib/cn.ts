import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gabungkan className bersyarat + resolusi konflik utility Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
