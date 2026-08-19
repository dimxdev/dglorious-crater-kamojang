import { Plus } from 'lucide-react';

/**
 * Satu butir tanya-jawab.
 *
 * Dibangun di atas `<details>`/`<summary>` bawaan browser, bukan state React:
 * bisa dibuka lewat papan ketik dan dibacakan pembaca layar tanpa satu baris
 * pun ARIA buatan sendiri, tetap berfungsi sebelum JavaScript termuat, dan
 * isinya ikut terjaring Ctrl+F browser. Aksesibilitas akordeon buatan tangan
 * hampir selalu lebih buruk daripada ini.
 *
 * Ikon plus berputar 45° jadi silang saat terbuka — memutar satu elemen jauh
 * lebih murah daripada menukar dua ikon, dan tidak ada yang berkedip.
 */
export function Disclosure({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group border-ash-300/70 border-b">
      <summary className="focus-visible:ring-mineral-500 marker:content-none flex cursor-pointer list-none items-start justify-between gap-6 py-5 focus-visible:ring-2 focus-visible:outline-none">
        <span className="text-ash-900 font-serif text-[1.1rem] leading-snug">
          {question}
        </span>
        <span
          aria-hidden
          className="text-mineral-600 bg-mineral-50 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45"
        >
          <Plus size={16} strokeWidth={2} />
        </span>
      </summary>
      <p className="text-ash-700 max-w-[68ch] pr-14 pb-6 text-[14.5px] leading-[1.8]">
        {answer}
      </p>
    </details>
  );
}
