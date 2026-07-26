import type { Locale } from '@/lib/i18n/config';
import { pick, type LocalizedText } from './localized';

/**
 * Mock tabel `settings` (PROJECT.md §8.3 & §10) — konfigurasi global yang
 * seharusnya bisa diubah admin lewat /admin/settings, BUKAN hardcode di
 * komponen. Nanti diganti fetch API; struktur objek ini meniru baris
 * key/value yang akan datang dari backend.
 */
export type PaymentMethodType = 'bank' | 'ewallet' | 'qris';

/** Satu metode pembayaran yang admin sampaikan manual ke tamu via WhatsApp. */
export type PaymentMethod = {
  type: PaymentMethodType;
  label: string; // "BSI", "DANA", "QRIS Koperasi Alam Lestari"
  accountNumber?: string; // nomor rekening/akun — tidak dipakai utk qris
  accountHolder?: string; // atas nama — tidak dipakai utk qris
};

export type SettingsSource = {
  checkInTime: string;
  checkOutTime: string;
  waNumber: string;
  paymentMethods: PaymentMethod[];
  termsAndConditions: LocalizedText[];
};

export type Settings = {
  checkInTime: string;
  checkOutTime: string;
  waNumber: string;
  paymentMethods: PaymentMethod[];
  termsAndConditions: string[];
};

// 12 poin S&K resmi dari klien (form reservasi WhatsApp D'Glorious Crater
// Kamojang) — menggantikan draft internal sebelumnya yang belum direview klien.
const settingsSource: SettingsSource = {
  checkInTime: '14.00',
  checkOutTime: '12.00',
  waNumber: '6282112345678',
  paymentMethods: [
    { type: 'bank', label: 'BSI', accountNumber: '7262292465', accountHolder: 'KOPERASI ALAM LESTARI' },
  ],
  termsAndConditions: [
    {
      id: 'Melakukan pembayaran Down Payment 50% paling lambat 1x24 jam setelah dealing.',
      en: 'Pay a 50% down payment no later than 1x24 hours after the deal is agreed.',
    },
    {
      id: 'Lebih dari 1x24 jam, booking akan rilis otomatis oleh sistem ke tamu lain.',
      en: 'After 1x24 hours, the booking is automatically released by the system to other guests.',
    },
    {
      id: 'FOTO bukti transfer silahkan dikirim ke nomor WhatsApp ini.',
      en: 'Please send a photo of the transfer receipt to this WhatsApp number.',
    },
    {
      id: 'Hanya melakukan pembayaran ke rekening yang diberikan oleh staff Reservasi.',
      en: 'Only make payment to the account provided by the Reservation staff.',
    },
    {
      id: 'Apabila melakukan pembatalan setelah pembayaran, maka pembayaran akan hangus (tidak ada refund).',
      en: 'If you cancel after payment, the payment is forfeited (no refund).',
    },
    {
      id: 'Konfirmasi reschedule dapat dilakukan paling lambat 7 hari sebelum tanggal check-in semula.',
      en: 'Reschedule confirmation must be done no later than 7 days before the original check-in date.',
    },
    {
      id: 'Jumlah orang lebih dari kapasitas tenda/room harus dengan tambahan ekstra bed atau charge person. Disarankan untuk ganti tipe tenda yang lebih besar atau menambah tenda.',
      en: 'Guests exceeding tent/room capacity require an extra bed or extra-person charge. We recommend switching to a larger tent type or adding another tent.',
    },
    {
      id: 'Anak umur 6 tahun keatas dihitung sama dengan 1 orang dewasa. Dan anak umur dibawah 5 tahun belum terhitung dewasa.',
      en: 'Children aged 6 and above are counted as 1 adult. Children under 5 are not counted as an adult.',
    },
    {
      id: 'Tidak diperkenankan membawa hewan peliharaan selama menginap.',
      en: 'Pets are not allowed during the stay.',
    },
    {
      id: 'Mohon sertakan foto KTP orang bersangkutan yang melakukan reservasi.',
      en: 'Please include a photo of the ID card (KTP) of the person making the reservation.',
    },
    {
      id: 'Waktu check-in jam 14.00 dan check-out jam 12.00. Tidak bisa melakukan early check-in dan late check-out karena ada tamu sebelum dan sesudahnya.',
      en: 'Check-in time is 14:00 and check-out is 12:00. Early check-in and late check-out are not possible due to other guests before and after.',
    },
    {
      id: 'Pembayaran via transfer ke Rekening BSI 7262292465 a/n KOPERASI ALAM LESTARI.',
      en: 'Payment via transfer to BSI Account 7262292465 a/n KOPERASI ALAM LESTARI.',
    },
  ],
};

export function getSettings(locale: Locale): Settings {
  return {
    checkInTime: settingsSource.checkInTime,
    checkOutTime: settingsSource.checkOutTime,
    waNumber: settingsSource.waNumber,
    paymentMethods: settingsSource.paymentMethods,
    termsAndConditions: settingsSource.termsAndConditions.map((t) => pick(t, locale)),
  };
}
