import { apiFetch } from './client';

export type CreateBookingItemInput = {
  roomTypeId: number;
  adults: number;
  children: number;
  extraBedQty?: number;
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
};

export type PaymentMethodInput =
  | 'CASH'
  | 'QRIS'
  | 'BANK_TRANSFER'
  | 'VIRTUAL_ACCOUNT'
  | 'EWALLET'
  | 'CREDIT_CARD'
  | 'OTHER';

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
  adults: number;
  children: number;
  extraBedQty: number;
  extraBedType: string | null;
  extraBedPrice: number;
  subtotalSnapshot: number;
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
