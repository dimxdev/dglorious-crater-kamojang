'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  // Tutup dengan tombol Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm"
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl',
          className,
        )}
      >
        {title && (
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <h3 className="text-forest-800 font-serif text-lg font-semibold">
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="text-muted hover:bg-cream-100 rounded-md p-1 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
