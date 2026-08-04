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
  /** Wajib untuk WALK_IN — dipakai backend bikin baris Payment. */
  payMethod?: PaymentMethodInput;
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
  isPriceOverride: boolean;
  status: string;
  effectiveStatus: string;
  bookingChannel: string;
  notes: string | null;
  items: AdminBookingItem[];
};

export function createBooking(token: string, dto: CreateBookingInput) {
  return apiFetch<AdminBookingDetail>('/admin/bookings', {
    method: 'POST',
    token,
    body: dto,
  });
}
