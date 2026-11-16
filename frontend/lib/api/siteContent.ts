import type { Locale } from '@/lib/i18n/config';
import { apiFetch } from './client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Bentuk konten (mirror spec revisi dospem 2026-11) ────────

/** Teks dwibahasa. `id` wajib terisi; `en` boleh kosong (tampilkan `id` sebagai fallback). */
export type Localized = { id: string; en: string };

export type SiteSections = {
  home_hero: { title: Localized; subtitle: Localized; imageUrl: string };
  home_attractions: { title: Localized };
  home_facilities_teaser: { body: Localized };
  home_lodging: { title: Localized; subtitle: Localized };
  home_info: { title: Localized; imageUrl: string };
  home_routes: { title: Localized; lead: Localized; mapsUrl: string };
  home_faq: { title: Localized; lead: Localized };
  home_cta: { title: Localized; subtitle: Localized; imageUrl: string };
  about_intro: {
    title: Localized;
    lead: Localized;
    /** 0–4 stat. */
    stats: { label: Localized; value: Localized }[];
  };
  /** `body`: paragraf dipisah baris kosong. */
  about_history: { body: Localized; imageUrl: string };
  about_attractions: { title: Localized };
  about_gallery: { title: Localized };
  about_tickets: { title: Localized; note: Localized };
  about_parking: { title: Localized };
  facilities: { title: Localized; note: Localized; disclaimer: Localized };
  listing: {
    title: Localized;
    lead: Localized;
    helpTitle: Localized;
    helpBody: Localized;
  };
  room_detail: {
    childrenRule: Localized;
    universalFacilitiesNote: Localized;
    priceNote: Localized;
  };
  terms: {
    title: Localized;
    subtitle: Localized;
    questionTitle: Localized;
    questionBody: Localized;
  };
  contact: {
    address: Localized;
    mapsQuery: string;
    footerTagline: Localized;
    /** `room` memuat placeholder `{room}` (nama tipe unit). */
    waMessages: {
      general: Localized;
      booking: Localized;
      room: Localized;
      terms: Localized;
    };
  };
  site_meta: { description: Localized };
};

export type SectionKey = keyof SiteSections;

export type ContentCollection =
  | 'ATTRACTION'
  | 'INFO_CARD'
  | 'ROUTE'
  | 'FAQ'
  | 'TICKET_PACKAGE'
  | 'PARKING_FEE'
  | 'GALLERY'
  | 'FACILITY_ZONE';

/** `icon` = key dari `@/lib/icons`. */
export type CollectionContent = {
  ATTRACTION: { name: Localized; desc: Localized; icon: string; featured: boolean };
  INFO_CARD: {
    icon: string;
    title: Localized;
    line1: Localized;
    line2: Localized;
    linkLabel?: Localized;
    href?: string;
  };
  ROUTE: { from: Localized; duration: Localized; distance: Localized; note: Localized };
  FAQ: { q: Localized; a: Localized };
  TICKET_PACKAGE: {
    name: Localized;
    note?: Localized;
    benefits: Localized[];
    priceDay: number;
    priceNight: number;
  };
  PARKING_FEE: { vehicle: Localized; price: number };
  GALLERY: { label: Localized };
  FACILITY_ZONE: { icon: string; name: Localized; note: Localized; items: Localized[] };
};

/** Item di `GET /site-content` (hanya yang aktif, sudah terurut). */
export type PublicContentItem<C extends ContentCollection> = {
  id: number;
  imageUrl: string | null;
  content: CollectionContent[C];
};

/** Item di endpoint admin (termasuk yang nonaktif). */
export type AdminContentItem<C extends ContentCollection> = {
  id: number;
  collection: C;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  content: CollectionContent[C];
  createdAt: string;
  updatedAt: string;
};

export type SiteContent = {
  sections: SiteSections;
  collections: { [C in ContentCollection]: PublicContentItem<C>[] };
};

export type AdminSection<K extends SectionKey = SectionKey> = {
  key: K;
  content: SiteSections[K];
  updatedAt: string;
  updatedBy: { name: string } | null;
};

// ── Helper tampilan ──────────────────────────────────────────

/** Pilih teks sesuai locale; `en` kosong → jatuh ke `id`. */
export function pickL(l: Localized | undefined | null, locale: Locale): string {
  if (!l) return '';
  if (locale === 'en' && l.en.trim() !== '') return l.en;
  return l.id;
}

/**
 * `/uploads/*` → diprefix origin API; `/images/*` (aset Next.js) dan URL
 * http(s) dibiarkan apa adanya.
 */
export function resolveContentImage(url: string): string {
  return url.startsWith('/uploads/') ? `${API_URL}${url}` : url;
}

// ── Publik ───────────────────────────────────────────────────

export function fetchSiteContent() {
  return apiFetch<SiteContent>('/site-content');
}

// ── Admin (SUPER_ADMIN) ──────────────────────────────────────

export function fetchAdminSections(token: string) {
  return apiFetch<AdminSection[]>('/admin/site-content/sections', { token });
}

export function updateSection<K extends SectionKey>(
  token: string,
  key: K,
  content: SiteSections[K],
) {
  return apiFetch<AdminSection<K>>(`/admin/site-content/sections/${key}`, {
    method: 'PUT',
    token,
    body: { content },
  });
}

export function fetchAdminItems<C extends ContentCollection>(token: string, collection: C) {
  return apiFetch<AdminContentItem<C>[]>(
    `/admin/site-content/items?collection=${collection}`,
    { token },
  );
}

export type CreateItemInput<C extends ContentCollection> = {
  collection: C;
  content: CollectionContent[C];
  imageUrl?: string;
  isActive?: boolean;
};

export function createItem<C extends ContentCollection>(token: string, dto: CreateItemInput<C>) {
  return apiFetch<AdminContentItem<C>>('/admin/site-content/items', {
    method: 'POST',
    token,
    body: dto,
  });
}

export type UpdateItemInput<C extends ContentCollection> = {
  content?: CollectionContent[C];
  /** `null` atau "" menghapus gambar. */
  imageUrl?: string | null;
  isActive?: boolean;
};

export function updateItem<C extends ContentCollection>(
  token: string,
  id: number,
  dto: UpdateItemInput<C>,
) {
  return apiFetch<AdminContentItem<C>>(`/admin/site-content/items/${id}`, {
    method: 'PATCH',
    token,
    body: dto,
  });
}

export function deleteItem(token: string, id: number) {
  return apiFetch<{ success: true }>(`/admin/site-content/items/${id}`, {
    method: 'DELETE',
    token,
  });
}

/** `ids` harus memuat SEMUA item koleksi (aktif & nonaktif) dalam urutan baru. */
export function reorderItems<C extends ContentCollection>(
  token: string,
  collection: C,
  ids: number[],
) {
  return apiFetch<AdminContentItem<C>[]>('/admin/site-content/items/reorder', {
    method: 'PUT',
    token,
    body: { collection, ids },
  });
}

// Multipart — body JSON milik apiFetch tidak cocok, pola sama dengan uploadRoomImage.
export async function uploadSiteImage(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/admin/site-content/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? `Upload gagal (${res.status})`);
  }
  return data as { url: string };
}

// ── Pengaturan umum (tabel settings) ─────────────────────────

export function fetchAdminSettings(token: string) {
  return apiFetch<Record<string, string>>('/admin/settings', { token });
}

/** Hanya key yang sudah ada; key asing ditolak 400. Mengembalikan seluruh settings terbaru. */
export function updateSettings(token: string, values: Record<string, string>) {
  return apiFetch<Record<string, string>>('/admin/settings', {
    method: 'PUT',
    token,
    body: { values },
  });
}
