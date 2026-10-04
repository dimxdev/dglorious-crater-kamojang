import { apiFetch } from './client';
import type { AdminBooking, BookingChannel, BookingStoredStatus } from '@/lib/data/admin';

export type CreateBookingItemInput = {
  roomTypeId: number;
  adults: number;
  children: number;
  extraBedQty?: number;
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
};

export type PaymentMethodInput = 'CASH' | 'QRIS' | 'BANK_TRANSFER';

export type CreateBookingInput = {
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  bookingChannel: 'WHATSAPP' | 'WALK_IN';
  /** Wajib untuk WHATSAPP (admin pilih sesuai kondisi saat itu); diabaikan untuk WALK_IN. */
  initialStatus?: 'DP' | 'LUNAS';
  notes?: string;
  isPriceOverride?: boolean;
  manualTotal?: number;
  /** Potongan nominal opsional — dikurangi dari total (otomatis atau manual) sebelum dibekukan jadi `priceSnapshot`. */
  discount?: number;
  /** Wajib untuk WALK_IN — dipakai backend bikin baris Payment. */
  payMethod?: PaymentMethodInput;
  /** Wajib untuk WHATSAPP + status DP — nominal yang sudah masuk (bukan diasumsikan 50%). */
  paidAmount?: number;
  items: CreateBookingItemInput[];
};

export type AdminBookingItem = {
  roomTypeId: number;
  roomTypeSlug: string;
  roomTypeName: string;
  roomTypeCategory: string;
  adults: number;
  children: number;
  extraBedQty: number;
  extraBedType: string | null;
  extraBedPrice: number;
  subtotalSnapshot: number;
};

export type BookingEditLog = {
  id: number;
  editedAt: string;
  editedByName: string;
  note: string;
  changes: Record<string, { from: unknown; to: unknown }>;
};

export type AdminBookingDetail = {
  id: number;
  bookingCode: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  priceSnapshot: number;
  /** Harga otomatis sistem (Σ subtotal item, sebelum discount & override). Null untuk data lama sebelum migrasi ini. */
  autoCalculatedTotal: number | null;
  /** Potongan nominal yang dipakai saat booking dibuat (0 kalau tidak ada diskon). */
  discount: number;
  /** Σ payments yang PAID — nominal yang beneran sudah masuk (bukan asumsi). */
  paidTotal: number;
  /** Transaksi mentah (status PAID saja) — dipakai hitung pendapatan per tanggal transaksi, bukan cuma agregat. */
  payments: { amount: number; paidAt: string | null }[];
  isPriceOverride: boolean;
  status: string;
  effectiveStatus: string;
  bookingChannel: string;
  notes: string | null;
  items: AdminBookingItem[];
  editLogs: BookingEditLog[];
};

export type BookingStatusUpdate = 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW';

export function createBooking(token: string, dto: CreateBookingInput) {
  return apiFetch<AdminBookingDetail>('/admin/bookings', {
    method: 'POST',
    token,
    body: dto,
  });
}

export function fetchAdminBookings(token: string) {
  return apiFetch<AdminBookingDetail[]>('/admin/bookings', { token });
}

export function updateBookingStatus(token: string, code: string, status: BookingStatusUpdate) {
  return apiFetch<AdminBookingDetail>(`/admin/bookings/${code}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export type EditBookingItemInput = {
  roomTypeId: number;
  adults: number;
  children: number;
  extraBedQty?: number;
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
};

export type EditBookingInput = {
  guestName?: string;
  guestPhone?: string;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  items?: EditBookingItemInput[];
  priceOverride?: number;
  discount?: number;
  note: string;
};

export function fetchAdminBookingByCode(token: string, code: string) {
  return apiFetch<AdminBookingDetail>(`/admin/bookings/${code}`, { token });
}

export function editBooking(token: string, code: string, dto: EditBookingInput) {
  return apiFetch<AdminBookingDetail>(`/admin/bookings/${code}`, {
    method: 'PATCH',
    token,
    body: dto,
  });
}

/**
 * Memetakan `AdminBookingDetail` (respons API) ke bentuk `AdminBooking` yang
 * dipakai fungsi analitik (`occupiedQtyOnDate`, `effectiveStatus`,
 * `lib/data/owner.ts`). Dipakai bersama oleh Ringkasan Admin & Dashboard
 * Owner. `adults`/`children`/`extraBedQty` cuma dijumlah kasar karena
 * dashboard ringkasan tidak menampilkan rincian per-item booking.
 */
export function toAdminBooking(b: AdminBookingDetail): AdminBooking {
  return {
    kode: b.bookingCode,
    guest: b.guestName,
    wa: b.guestPhone,
    rooms: b.items.map((i) => ({
      slug: i.roomTypeSlug,
      qty: 1,
      name: i.roomTypeName,
      category: i.roomTypeCategory,
    })),
    createdAt: b.createdAt.slice(0, 10),
    checkIn: b.checkIn.slice(0, 10),
    checkOut: b.checkOut.slice(0, 10),
    source: b.bookingChannel as BookingChannel,
    total: b.priceSnapshot,
    status: b.status as BookingStoredStatus,
    adults: b.items.reduce((s, i) => s + i.adults, 0),
    children: b.items.reduce((s, i) => s + i.children, 0),
    extraBedQty: b.items.reduce((s, i) => s + i.extraBedQty, 0),
  };
}
