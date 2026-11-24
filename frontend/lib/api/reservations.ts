import { apiFetch } from './client';
import { formatPhoneDisplay } from '@/lib/phone';
import type { AdminReservation, ReservationChannel, ReservationStoredStatus } from '@/lib/data/admin';

export type CreateReservationItemInput = {
  roomTypeId: number;
  adults: number;
  children: number;
  extraBedQty?: number;
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
};

export type PaymentMethodInput = 'CASH' | 'QRIS' | 'BANK_TRANSFER';

export type CreateReservationInput = {
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  channel: 'RESERVASI' | 'LANGSUNG';
  /** Wajib untuk RESERVASI (admin pilih sesuai kondisi saat itu); diabaikan untuk LANGSUNG. */
  initialStatus?: 'DP' | 'LUNAS';
  notes?: string;
  isPriceOverride?: boolean;
  manualTotal?: number;
  /** Potongan nominal opsional — dikurangi dari total (otomatis atau manual) sebelum dibekukan jadi `priceSnapshot`. */
  discount?: number;
  /** Wajib untuk LANGSUNG — dipakai backend bikin baris Payment. */
  payMethod?: PaymentMethodInput;
  /** Wajib untuk RESERVASI + status DP — nominal yang sudah masuk (bukan diasumsikan 50%). */
  paidAmount?: number;
  items: CreateReservationItemInput[];
};

export type AdminReservationItem = {
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

export type ReservationEditLog = {
  id: number;
  editedAt: string;
  editedByName: string;
  note: string;
  changes: Record<string, { from: unknown; to: unknown }>;
};

export type AdminReservationDetail = {
  id: number;
  reservationCode: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  priceSnapshot: number;
  /** Harga otomatis sistem (Σ subtotal item, sebelum discount & override). Null untuk data lama sebelum migrasi ini. */
  autoCalculatedTotal: number | null;
  /** Potongan nominal yang dipakai saat reservasi dibuat (0 kalau tidak ada diskon). */
  discount: number;
  /** Σ payments tercatat — nominal yang beneran sudah masuk (bukan asumsi). */
  paidTotal: number;
  /** Transaksi mentah (semua pembayaran yang tercatat sudah diterima) — dipakai hitung pendapatan per tanggal transaksi, bukan cuma agregat. */
  payments: { amount: number; paidAt: string | null }[];
  isPriceOverride: boolean;
  status: string;
  effectiveStatus: string;
  channel: string;
  notes: string | null;
  items: AdminReservationItem[];
  editLogs: ReservationEditLog[];
};

export type ReservationStatusUpdate = 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW';

export function createReservation(token: string, dto: CreateReservationInput) {
  return apiFetch<AdminReservationDetail>('/admin/reservations', {
    method: 'POST',
    token,
    body: dto,
  });
}

export function fetchAdminReservations(token: string) {
  return apiFetch<AdminReservationDetail[]>('/admin/reservations', { token });
}

export function updateReservationStatus(token: string, code: string, status: ReservationStatusUpdate) {
  return apiFetch<AdminReservationDetail>(`/admin/reservations/${code}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export type EditReservationItemInput = {
  roomTypeId: number;
  adults: number;
  children: number;
  extraBedQty?: number;
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
};

export type EditReservationInput = {
  guestName?: string;
  guestPhone?: string;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  items?: EditReservationItemInput[];
  priceOverride?: number;
  discount?: number;
  note: string;
};

export function fetchAdminReservationByCode(token: string, code: string) {
  return apiFetch<AdminReservationDetail>(`/admin/reservations/${code}`, { token });
}

export function editReservation(token: string, code: string, dto: EditReservationInput) {
  return apiFetch<AdminReservationDetail>(`/admin/reservations/${code}`, {
    method: 'PATCH',
    token,
    body: dto,
  });
}

/**
 * Memetakan `AdminReservationDetail` (respons API) ke bentuk `AdminReservation` yang
 * dipakai fungsi analitik (`occupiedQtyOnDate`, `effectiveStatus`,
 * `lib/data/owner.ts`). Dipakai bersama oleh Ringkasan Admin & Dashboard
 * Owner. `adults`/`children`/`extraBedQty` cuma dijumlah kasar karena
 * dashboard ringkasan tidak menampilkan rincian per-item reservasi.
 */
export function toAdminReservation(b: AdminReservationDetail): AdminReservation {
  return {
    kode: b.reservationCode,
    guest: b.guestName,
    wa: formatPhoneDisplay(b.guestPhone),
    rooms: b.items.map((i) => ({
      slug: i.roomTypeSlug,
      qty: 1,
      name: i.roomTypeName,
      category: i.roomTypeCategory,
    })),
    createdAt: b.createdAt.slice(0, 10),
    checkIn: b.checkIn.slice(0, 10),
    checkOut: b.checkOut.slice(0, 10),
    source: b.channel as ReservationChannel,
    total: b.priceSnapshot,
    status: b.status as ReservationStoredStatus,
    adults: b.items.reduce((s, i) => s + i.adults, 0),
    children: b.items.reduce((s, i) => s + i.children, 0),
    extraBedQty: b.items.reduce((s, i) => s + i.extraBedQty, 0),
  };
}
