import type { Locale } from '@/lib/i18n/config';
import { apiFetch } from './client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Shared shapes ────────────────────────────────────────────

export type FacilityApi = { icon: string; label: { id: string; en?: string } };

export type TranslationInput = {
  name: string;
  category: string;
  tagline?: string;
  description?: string;
  bedInfo?: string;
  bathroomInfo?: string;
  rules?: string;
};

export type RoomTypeInput = {
  slug: string;
  priceWeekday: number;
  priceWeekend: number;
  capacity: number;
  totalUnits: number;
  extraBedPrice?: number;
  extraNoBedPrice?: number;
  extraFlatPrice?: number;
  isActive?: boolean;
  facilities: FacilityApi[];
  translations: { id: TranslationInput; en?: TranslationInput };
};

/** PATCH payload — slug is immutable, backend rejects it entirely (§ create-room-type.dto.ts). */
export type RoomTypeUpdateInput = Omit<RoomTypeInput, 'slug'>;

// ── Admin: list & detail ────────────────────────────────────

export type AdminRoomTypeListItem = {
  id: number;
  slug: string;
  name: string;
  category: string;
  priceWeekday: number;
  priceWeekend: number;
  capacity: number;
  totalUnits: number;
  isActive: boolean;
  coverImageUrl: string | null;
};

export type AdminTranslation = {
  languageCode: 'ID' | 'EN';
  name: string;
  category: string;
  tagline: string | null;
  description: string | null;
  bedInfo: string | null;
  bathroomInfo: string | null;
  rules: string | null;
};

export type AdminRoomImage = { id: number; imageUrl: string; isCover: boolean; sortOrder: number };
export type AdminRoomUnit = { id: number; unitCode: string; status: 'AVAILABLE' };

export type AdminRoomTypeDetail = {
  id: number;
  slug: string;
  // Decimal fields come back as strings from Prisma's JSON serialization.
  priceWeekday: string;
  priceWeekend: string;
  capacity: number;
  totalUnits: number;
  extraBedPrice: string | null;
  extraNoBedPrice: string | null;
  extraFlatPrice: string | null;
  isActive: boolean;
  facilities: FacilityApi[];
  translations: AdminTranslation[];
  images: AdminRoomImage[];
  units: AdminRoomUnit[];
};

export function fetchAdminRoomTypes(token: string) {
  return apiFetch<AdminRoomTypeListItem[]>('/admin/room-types', { token });
}

export function fetchAdminRoomType(token: string, id: number) {
  return apiFetch<AdminRoomTypeDetail>(`/admin/room-types/${id}`, { token });
}

export function createRoomType(token: string, dto: RoomTypeInput) {
  return apiFetch<AdminRoomTypeDetail>('/admin/room-types', {
    method: 'POST',
    token,
    body: dto,
  });
}

export function updateRoomType(token: string, id: number, dto: Partial<RoomTypeUpdateInput>) {
  return apiFetch<AdminRoomTypeDetail>(`/admin/room-types/${id}`, {
    method: 'PATCH',
    token,
    body: dto,
  });
}

export function deleteRoomType(token: string, id: number) {
  return apiFetch<void>(`/admin/room-types/${id}`, { method: 'DELETE', token });
}

// ── Images (multipart — apiFetch's JSON body doesn't fit here) ──

export async function uploadRoomImage(token: string, roomTypeId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/admin/room-types/${roomTypeId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? `Upload gagal (${res.status})`);
  }
  return data as AdminRoomImage;
}

export function setCoverImage(token: string, imageId: number) {
  return apiFetch<void>(`/admin/room-images/${imageId}/cover`, { method: 'PATCH', token });
}

export function deleteRoomImage(token: string, imageId: number) {
  return apiFetch<void>(`/admin/room-images/${imageId}`, { method: 'DELETE', token });
}

/** Prefix a backend-relative image URL (e.g. `/uploads/...`) with the API origin. */
export function resolveImageUrl(url: string): string {
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

// ── Public: katalog (§8 PROJECT.md — no auth, guests never log in) ──
// Backend already picks the language server-side (fallback ID if EN empty),
// so switching locale means refetching — see FASE 6 plan for the tradeoff.

export type PublicFacility = { icon: string; label: string };

export type PublicRoomTypeSummary = {
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  priceWeekday: number;
  priceWeekend: number;
  capacity: number;
  coverImageUrl: string | null;
  facilities: PublicFacility[];
};
export type PublicRoomImage = { url: string; isCover: boolean };

export type PublicRoomTypeDetail = {
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  description: string | null;
  bedInfo: string | null;
  bathroomInfo: string | null;
  rules: string | null;
  priceWeekday: number;
  priceWeekend: number;
  capacity: number;
  totalUnits: number;
  extraBedPrice: number | null;
  extraNoBedPrice: number | null;
  extraFlatPrice: number | null;
  facilities: PublicFacility[];
  images: PublicRoomImage[];
};

// ── Admin: availability check ────────────────────────────────

export type AvailabilityResult = {
  roomTypeId: number;
  totalUnits: number;
  bookedQty: number;
  availableUnits: number;
  isAvailable: boolean;
};

export function checkRoomTypeAvailability(
  token: string,
  id: number,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: number,
) {
  let url = `/admin/room-types/${id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`;
  if (excludeBookingId) url += `&excludeBookingId=${excludeBookingId}`;
  return apiFetch<AvailabilityResult>(url, { token });
}

// ── Public: katalog (§8 PROJECT.md — no auth, guests never log in) ──
export function fetchPublicRoomTypes(locale: Locale) {
  return apiFetch<PublicRoomTypeSummary[]>(`/room-types?lang=${locale.toUpperCase()}`);
}

export function fetchPublicRoomTypeBySlug(slug: string, locale: Locale) {
  return apiFetch<PublicRoomTypeDetail>(`/room-types/${slug}?lang=${locale.toUpperCase()}`);
}
