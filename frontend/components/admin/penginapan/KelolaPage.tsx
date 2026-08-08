'use client';

import {
  ImageOff,
  ImagePlus,
  Pencil,
  Plus,
  Star,
  Tent,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge, Button, Input, Modal, Select } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  type AdminRoomImage,
  type AdminRoomTypeDetail,
  type AdminRoomTypeListItem,
  type AdminTranslation,
  type RoomTypeInput,
  createRoomType,
  deleteRoomImage,
  deleteRoomType,
  fetchAdminRoomType,
  fetchAdminRoomTypes,
  resolveImageUrl,
  setCoverImage,
  updateRoomType,
  uploadRoomImage,
} from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import type { IconName } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { FacilityListEditor, type FacilityRow } from './FacilityListEditor';

// Fase 1 cuma ID (wajib) + EN (opsional) — 中文 belum ada tempat penyimpanannya
// di backend (`RoomTypeTranslationsDto` cuma `id`/`en`), jangan bikin tab palsu.
const LANGS = ['ID', 'EN'] as const;
type Lang = (typeof LANGS)[number];

type DrawerTab = 'general' | 'content' | 'gallery';

type TranslationForm = {
  name: string;
  category: string;
  tagline: string;
  description: string;
  bedInfo: string;
  bathroomInfo: string;
  rules: string;
};

function emptyTranslation(): TranslationForm {
  return { name: '', category: '', tagline: '', description: '', bedInfo: '', bathroomInfo: '', rules: '' };
}

function translationToForm(t?: AdminTranslation): TranslationForm {
  return {
    name: t?.name ?? '',
    category: t?.category ?? '',
    tagline: t?.tagline ?? '',
    description: t?.description ?? '',
    bedInfo: t?.bedInfo ?? '',
    bathroomInfo: t?.bathroomInfo ?? '',
    rules: t?.rules ?? '',
  };
}

type FormState = {
  id: number | null; // null = belum disimpan (mode tambah)
  slug: string;
  priceWeekday: string;
  priceWeekend: string;
  capacity: string;
  totalUnits: string;
  extraBedPrice: string;
  extraNoBedPrice: string;
  extraFlatPrice: string;
  isActive: boolean;
  translations: Record<Lang, TranslationForm>;
  facilities: FacilityRow[];
  images: AdminRoomImage[];
};

function emptyForm(): FormState {
  return {
    id: null,
    slug: '',
    priceWeekday: '',
    priceWeekend: '',
    capacity: '',
    totalUnits: '',
    extraBedPrice: '',
    extraNoBedPrice: '',
    extraFlatPrice: '',
    isActive: true,
    translations: { ID: emptyTranslation(), EN: emptyTranslation() },
    facilities: [],
    images: [],
  };
}

function detailToForm(detail: AdminRoomTypeDetail): FormState {
  const idT = detail.translations.find((t) => t.languageCode === 'ID');
  const enT = detail.translations.find((t) => t.languageCode === 'EN');
  return {
    id: detail.id,
    slug: detail.slug,
    priceWeekday: detail.priceWeekday,
    priceWeekend: detail.priceWeekend,
    capacity: String(detail.capacity),
    totalUnits: String(detail.totalUnits),
    extraBedPrice: detail.extraBedPrice ?? '',
    extraNoBedPrice: detail.extraNoBedPrice ?? '',
    extraFlatPrice: detail.extraFlatPrice ?? '',
    isActive: detail.isActive,
    translations: { ID: translationToForm(idT), EN: translationToForm(enT) },
    facilities: detail.facilities.map((f) => ({
      icon: f.icon as IconName,
      label: { ID: f.label.id, EN: f.label.en ?? '' },
    })),
    images: detail.images,
  };
}

/** Konversi form → payload API. EN cuma dikirim kalau admin benar-benar mengisinya
 *  (name/category) — kalau dikosongkan lagi, biarkan EN lama tetap tersimpan
 *  apa adanya daripada dipaksa "should not be empty" dari backend. */
function formToInput(form: FormState): RoomTypeInput {
  const toTranslationInput = (t: TranslationForm) => ({
    name: t.name.trim(),
    category: t.category.trim(),
    tagline: t.tagline.trim() || undefined,
    description: t.description.trim() || undefined,
    bedInfo: t.bedInfo.trim() || undefined,
    bathroomInfo: t.bathroomInfo.trim() || undefined,
    rules: t.rules.trim() || undefined,
  });
  const en = form.translations.EN;
  const hasEn = en.name.trim() !== '' || en.category.trim() !== '';

  return {
    slug: form.slug.trim(),
    priceWeekday: Number(form.priceWeekday) || 0,
    priceWeekend: Number(form.priceWeekend) || 0,
    capacity: Number(form.capacity) || 1,
    totalUnits: Number(form.totalUnits) || 0,
    extraBedPrice: form.extraBedPrice !== '' ? Number(form.extraBedPrice) : undefined,
    extraNoBedPrice: form.extraNoBedPrice !== '' ? Number(form.extraNoBedPrice) : undefined,
    extraFlatPrice: form.extraFlatPrice !== '' ? Number(form.extraFlatPrice) : undefined,
    isActive: form.isActive,
    facilities: form.facilities.map((f) => ({
      icon: f.icon,
      label: { id: f.label.ID ?? '', en: f.label.EN || undefined },
    })),
    translations: {
      id: toTranslationInput(form.translations.ID),
      en: hasEn ? toTranslationInput(en) : undefined,
    },
  };
}

type DrawerState = {
  form: FormState;
  lang: Lang;
  tab: DrawerTab;
  loadingDetail: boolean;
  saving: boolean;
  error: string | null;
};

export function KelolaPage() {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [rooms, setRooms] = useState<AdminRoomTypeListItem[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRoomTypeListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    if (!token) return;
    try {
      setListError(null);
      setRooms(await fetchAdminRoomTypes(token));
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : t('admin.loadError'));
    }
  }, [token, t]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  function openCreate() {
    setDrawer({
      form: emptyForm(),
      lang: 'ID',
      tab: 'general',
      loadingDetail: false,
      saving: false,
      error: null,
    });
  }

  async function openEdit(id: number) {
    if (!token) return;
    setDrawer({
      form: emptyForm(),
      lang: 'ID',
      tab: 'general',
      loadingDetail: true,
      saving: false,
      error: null,
    });
    try {
      const detail = await fetchAdminRoomType(token, id);
      setDrawer({
        form: detailToForm(detail),
        lang: 'ID',
        tab: 'general',
        loadingDetail: false,
        saving: false,
        error: null,
      });
    } catch (e) {
      setDrawer((d) =>
        d ? { ...d, loadingDetail: false, error: e instanceof ApiError ? e.message : t('admin.loadError') } : d,
      );
    }
  }

  async function handleSave() {
    if (!drawer || !token) return;

    // Dicegat di sini biar admin gak nunggu roundtrip cuma buat tahu ada
    // field wajib yang kosong — sekalian arahkan ke tab yang salah.
    const { form } = drawer;
    const idT = form.translations.ID;
    if (
      (form.id == null && form.slug.trim() === '') ||
      idT.name.trim() === '' ||
      idT.category.trim() === ''
    ) {
      const missingSlug = form.id == null && form.slug.trim() === '';
      setDrawer((d) =>
        d
          ? {
              ...d,
              tab: missingSlug ? 'general' : 'content',
              lang: missingSlug ? d.lang : 'ID',
              error: t('admin.cmsRequiredFields'),
            }
          : d,
      );
      return;
    }

    setDrawer((d) => (d ? { ...d, saving: true, error: null } : d));
    try {
      const input = formToInput(drawer.form);
      let detail: AdminRoomTypeDetail;
      if (drawer.form.id == null) {
        detail = await createRoomType(token, input);
      } else {
        const { slug: _slug, ...updateInput } = input; // slug immutable, backend rejects the key entirely
        detail = await updateRoomType(token, drawer.form.id, updateInput);
      }
      setDrawer({
        form: detailToForm(detail),
        lang: drawer.lang,
        tab: drawer.tab,
        loadingDetail: false,
        saving: false,
        error: null,
      });
      await refreshList();
    } catch (e) {
      setDrawer((d) =>
        d ? { ...d, saving: false, error: e instanceof ApiError ? e.message : t('admin.saveError') } : d,
      );
    }
  }

  async function handleUploadImage(file: File) {
    if (!drawer?.form.id || !token) return;
    try {
      const image = await uploadRoomImage(token, drawer.form.id, file);
      setDrawer((d) => (d ? { ...d, form: { ...d.form, images: [...d.form.images, image] } } : d));
      // First image also becomes the cover (backend rule) — card thumbnail needs it too.
      if (image.isCover) await refreshList();
    } catch (e) {
      setDrawer((d) => (d ? { ...d, error: e instanceof Error ? e.message : t('admin.uploadError') } : d));
    }
  }

  async function handleSetCover(imageId: number) {
    if (!token) return;
    try {
      await setCoverImage(token, imageId);
      setDrawer((d) =>
        d
          ? {
              ...d,
              form: {
                ...d.form,
                images: d.form.images.map((img) => ({ ...img, isCover: img.id === imageId })),
              },
            }
          : d,
      );
      // Card thumbnail shows the cover — needs refreshing too, not just the drawer.
      await refreshList();
    } catch {
      // Non-critical — cover badge just won't reflect the change; admin can retry.
    }
  }

  async function handleDeleteImage(imageId: number) {
    if (!token) return;
    try {
      await deleteRoomImage(token, imageId);
      let coverChanged = false;
      setDrawer((d) => {
        if (!d) return d;
        const remaining = d.form.images.filter((img) => img.id !== imageId);
        const removedWasCover = d.form.images.find((img) => img.id === imageId)?.isCover;
        if (removedWasCover && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isCover: true };
          coverChanged = true;
        }
        return { ...d, form: { ...d.form, images: remaining } };
      });
      if (coverChanged) await refreshList();
    } catch {
      // Non-critical — admin can retry the delete.
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteRoomType(token, deleteTarget.id);
      setDeleteTarget(null);
      await refreshList();
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : t('admin.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  const totalUnits = rooms?.reduce((sum, r) => sum + r.totalUnits, 0) ?? 0;

  return (
    <DashboardLayout title={t('dashboard.manage')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[13.5px] font-semibold">
            {rooms
              ? t('admin.activeCount', { n: rooms.filter((r) => r.isActive).length })
              : t('admin.loading')}
          </div>
          {rooms && (
            <div className="text-muted mt-0.5 text-[12px]">
              {t('admin.kelolaSummary', { types: rooms.length, units: totalUnits })}
            </div>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} strokeWidth={2.2} aria-hidden />
          {t('admin.addRoom')}
        </Button>
      </div>

      {/* Daftar tipe penginapan. Dulu tabel 9 kolom yang harus digeser
          horizontal padahal isinya cuma segelintir baris & foto tendanya
          cuma thumbnail 56px — produk visual kayak gini lebih kebaca sebagai
          kartu bergambar. */}
      <div className="mt-4">
        {listError && (
          <div className="border-border rounded-2xl border bg-white px-4 py-8 text-center">
            <p className="text-sm text-red-600">{listError}</p>
            <button
              onClick={() => void refreshList()}
              className="text-forest-700 mt-2 text-sm font-semibold underline"
            >
              {t('admin.retry')}
            </button>
          </div>
        )}
        {!listError && rooms === null && (
          <div className="border-border text-muted rounded-2xl border bg-white px-4 py-8 text-center text-sm">
            {t('admin.loading')}
          </div>
        )}
        {!listError && rooms?.length === 0 && (
          <div className="border-border flex flex-col items-center gap-1.5 rounded-2xl border bg-white px-4 py-14 text-center">
            <Tent size={30} strokeWidth={1.4} className="text-cream-400" aria-hidden />
            <p className="text-[13.5px] font-semibold">{t('admin.noRooms')}</p>
            <p className="text-muted text-[12.5px]">{t('admin.noRoomsHint')}</p>
            <Button className="mt-2" size="sm" onClick={openCreate}>
              <Plus size={14} strokeWidth={2.2} aria-hidden />
              {t('admin.addRoom')}
            </Button>
          </div>
        )}
        {rooms && rooms.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((r) => (
              <RoomCard
                key={r.id}
                room={r}
                onEdit={() => void openEdit(r.id)}
                onDelete={() => setDeleteTarget(r)}
              />
            ))}
          </div>
        )}
      </div>

      {drawer && (
        <CmsDrawer
          state={drawer}
          setState={setDrawer}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          onUploadImage={handleUploadImage}
          onSetCover={handleSetCover}
          onDeleteImage={handleDeleteImage}
        />
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        title={t('admin.delete')}
      >
        <p className="text-sm">{deleteTarget && t('admin.deleteConfirm', { name: deleteTarget.name })}</p>
        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
        <div className="mt-5 flex gap-2.5">
          <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? t('admin.deleting') : t('admin.delete')}
          </Button>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('admin.cancel')}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function RoomCard({
  room,
  onEdit,
  onDelete,
}: {
  room: AdminRoomTypeListItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'border-border flex flex-col overflow-hidden rounded-xl border bg-white shadow-[0_12px_30px_-22px_rgba(20,53,42,0.4)] transition-shadow hover:shadow-[0_16px_34px_-20px_rgba(20,53,42,0.5)]',
        !room.isActive && 'opacity-75',
      )}
    >
      <div className="relative aspect-[16/10] bg-cream-100">
        {room.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, arbitrary uploaded/external URLs
          <img
            src={resolveImageUrl(room.coverImageUrl)}
            alt={room.name}
            className={cn('h-full w-full object-cover', !room.isActive && 'grayscale')}
          />
        ) : (
          <div className="text-cream-400 flex h-full w-full items-center justify-center">
            <ImageOff size={26} strokeWidth={1.4} aria-hidden />
          </div>
        )}
        {!room.isActive && (
          <span className="absolute top-2 left-2 rounded-md bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold text-stone-600">
            {t('admin.inactive')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-serif text-[15px] font-bold">{room.name}</div>
            <div className="text-muted truncate text-[12.5px]">{room.category}</div>
          </div>
          {room.isActive && (
            <Badge tone="success" className="shrink-0 text-[11.5px]">
              {t('admin.active')}
            </Badge>
          )}
        </div>

        <div className="border-border mt-3 flex flex-col gap-1 border-t pt-3 text-[12.5px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">{t('admin.priceWeekday')}</span>
            <span className="font-semibold tabular-nums">{formatIDR(room.priceWeekday)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">{t('admin.priceWeekend')}</span>
            <span className="font-semibold tabular-nums">{formatIDR(room.priceWeekend)}</span>
          </div>
        </div>

        <div className="text-muted mt-3 flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1">
            <Users size={13} strokeWidth={1.9} aria-hidden />
            {room.capacity}
          </span>
          <span className="flex items-center gap-1">
            <Tent size={13} strokeWidth={1.9} aria-hidden />
            {room.totalUnits} {t('admin.unit')}
          </span>
        </div>

        <div className="mt-3.5 flex gap-2 pt-0.5">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil size={13} strokeWidth={2} aria-hidden />
            {t('admin.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 px-2.5 text-red-600 hover:bg-red-50"
            onClick={onDelete}
            aria-label={t('admin.delete')}
          >
            <Trash2 size={14} strokeWidth={2} aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CmsDrawer({
  state,
  setState,
  onClose,
  onSave,
  onUploadImage,
  onSetCover,
  onDeleteImage,
}: {
  state: DrawerState;
  setState: React.Dispatch<React.SetStateAction<DrawerState | null>>;
  onClose: () => void;
  onSave: () => void;
  onUploadImage: (file: File) => void;
  onSetCover: (imageId: number) => void;
  onDeleteImage: (imageId: number) => void;
}) {
  const { t } = useTranslation();
  const { form, lang, tab, loadingDetail, saving, error } = state;
  const isCreating = form.id == null;

  useBodyScrollLock(true);

  function updateForm(patch: Partial<FormState>) {
    setState((d) => (d ? { ...d, form: { ...d.form, ...patch } } : d));
  }
  function updateTranslation(l: Lang, patch: Partial<TranslationForm>) {
    setState((d) =>
      d
        ? { ...d, form: { ...d.form, translations: { ...d.form.translations, [l]: { ...d.form.translations[l], ...patch } } } }
        : d,
    );
  }
  function setLang(l: Lang) {
    setState((d) => (d ? { ...d, lang: l } : d));
  }
  function setTab(next: DrawerTab) {
    setState((d) => (d ? { ...d, tab: next } : d));
  }

  const t9n = form.translations[lang];
  const cover = form.images.find((i) => i.isCover);
  const rest = form.images.filter((i) => !i.isCover);

  const TABS: { key: DrawerTab; label: string; badge?: number }[] = [
    { key: 'general', label: t('admin.cmsTabGeneral') },
    { key: 'content', label: t('admin.cmsTabContent') },
    { key: 'gallery', label: t('admin.cmsGallery'), badge: form.images.length },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <button aria-hidden tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#141916]/50" />
      <div className="relative z-10 flex h-screen w-[560px] max-w-full flex-col bg-[#f4f1ea] shadow-2xl">
        {/* Header */}
        <div className="border-border border-b bg-white px-5 pt-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-serif text-lg font-bold">
                {isCreating ? t('admin.cmsTitleCreate') : t('admin.cmsTitleEdit')}
              </div>
              {!isCreating && form.slug && (
                <div className="text-muted mt-0.5 truncate text-[12px]">{form.slug}</div>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="text-muted hover:bg-cream-100 hover:text-foreground -mt-1 -mr-1.5 shrink-0 rounded-lg p-1.5 transition-colors"
            >
              <X size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </div>

          {/* Tab — form ini panjang (harga, 7 field terjemahan ×2 bahasa,
              fasilitas, galeri); dulu semuanya satu gulungan panjang. */}
          <div className="mt-3 flex gap-1">
            {TABS.map((tb) => {
              const active = tb.key === tab;
              return (
                <button
                  key={tb.key}
                  type="button"
                  onClick={() => setTab(tb.key)}
                  aria-pressed={active}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 pt-1 pb-2.5 text-[13px] font-semibold transition-colors',
                    active ? 'text-forest-700' : 'text-muted hover:text-foreground',
                  )}
                >
                  {tb.label}
                  {tb.badge !== undefined && tb.badge > 0 && (
                    <span className="bg-cream-100 text-muted rounded-md px-1.5 py-px text-[11px] font-bold tabular-nums">
                      {tb.badge}
                    </span>
                  )}
                  {active && (
                    <span className="bg-forest-700 absolute inset-x-2 -bottom-px h-0.5 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Isi */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loadingDetail ? (
            <p className="text-muted text-sm">{t('admin.loading')}</p>
          ) : (
            <>
              {tab === 'general' && (
                <div className="border-border grid grid-cols-2 gap-3.5 rounded-[14px] border bg-white p-5">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Input
                      label={t('admin.cmsSlug')}
                      name="slug"
                      value={form.slug}
                      disabled={!isCreating}
                      onChange={
                        isCreating ? (e) => updateForm({ slug: e.target.value }) : undefined
                      }
                      placeholder="eagle-hill"
                    />
                    <span className="text-muted text-xs">{t('admin.cmsSlugHint')}</span>
                  </div>
                  <Input
                    label={t('admin.capacity')}
                    name="capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => updateForm({ capacity: e.target.value })}
                  />
                  <Input
                    label={t('admin.cmsUnitCount')}
                    name="totalUnits"
                    type="number"
                    min={0}
                    value={form.totalUnits}
                    onChange={(e) => updateForm({ totalUnits: e.target.value })}
                  />
                  <Input
                    label={t('admin.priceWeekday')}
                    name="priceWeekday"
                    type="number"
                    min={0}
                    value={form.priceWeekday}
                    onChange={(e) => updateForm({ priceWeekday: e.target.value })}
                  />
                  <Input
                    label={t('admin.priceWeekend')}
                    name="priceWeekend"
                    type="number"
                    min={0}
                    value={form.priceWeekend}
                    onChange={(e) => updateForm({ priceWeekend: e.target.value })}
                  />
                  <Input
                    label={t('admin.extraBedPrice')}
                    name="extraBedPrice"
                    type="number"
                    min={0}
                    value={form.extraBedPrice}
                    onChange={(e) => updateForm({ extraBedPrice: e.target.value })}
                  />
                  <Input
                    label={t('admin.extraNoBedPrice')}
                    name="extraNoBedPrice"
                    type="number"
                    min={0}
                    value={form.extraNoBedPrice}
                    onChange={(e) => updateForm({ extraNoBedPrice: e.target.value })}
                  />
                  <Input
                    label={t('admin.extraFlatPrice')}
                    name="extraFlatPrice"
                    type="number"
                    min={0}
                    value={form.extraFlatPrice}
                    onChange={(e) => updateForm({ extraFlatPrice: e.target.value })}
                  />
                  <Select
                    label={t('admin.tStatus')}
                    name="status"
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(e) => updateForm({ isActive: e.target.value === 'active' })}
                    options={[
                      { value: 'active', label: t('admin.active') },
                      { value: 'inactive', label: t('admin.inactive') },
                    ]}
                  />
                </div>
              )}

              {tab === 'content' && (
                <>
                  {/* Pemilih bahasa + penanda terisi/kosong — dulu cuma dua
                      tombol polos, gak kelihatan apakah versi EN sudah diisi. */}
                  <div className="flex gap-2">
                    {LANGS.map((l) => {
                      const filled =
                        form.translations[l].name.trim() !== '' ||
                        form.translations[l].category.trim() !== '';
                      const active = lang === l;
                      return (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          aria-pressed={active}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                            active
                              ? 'border-forest-700 bg-forest-700 text-white'
                              : 'border-border bg-white hover:bg-cream-100',
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              filled
                                ? active
                                  ? 'bg-white/75'
                                  : 'bg-green-600'
                                : active
                                  ? 'bg-white/30'
                                  : 'bg-stone-300',
                            )}
                          />
                          {l}
                          <span className={cn('text-[11px] font-medium', active ? 'text-white/70' : 'text-muted')}>
                            {filled ? t('admin.cmsLangFilled') : t('admin.cmsLangEmpty')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-border mt-3 rounded-[14px] border bg-white p-5">
                    <div className="mb-4 rounded-lg bg-[#FBEFD5] px-3 py-2 text-xs text-[#8a6d1f]">
                      {t('admin.cmsIdRequired')}
                    </div>
                    <div className="flex flex-col gap-3.5">
                      <Input
                        label={`${t('admin.cmsName')} (${lang})`}
                        name="name"
                        value={t9n.name}
                        onChange={(e) => updateTranslation(lang, { name: e.target.value })}
                        placeholder="Nama penginapan"
                      />
                      <Input
                        label={`${t('admin.cmsCategory')} (${lang})`}
                        name="category"
                        value={t9n.category}
                        onChange={(e) => updateTranslation(lang, { category: e.target.value })}
                        placeholder={t('admin.cmsCategoryHint')}
                      />
                      <Input
                        label={`${t('admin.cmsTagline')} (${lang})`}
                        name="tagline"
                        value={t9n.tagline}
                        onChange={(e) => updateTranslation(lang, { tagline: e.target.value })}
                      />
                      <LabeledTextarea
                        label={`${t('admin.cmsDesc')} (${lang})`}
                        value={t9n.description}
                        onChange={(v) => updateTranslation(lang, { description: v })}
                        placeholder="Deskripsi penginapan"
                        rows={3}
                      />
                      <Input
                        label={`${t('admin.cmsBedInfo')} (${lang})`}
                        name="bedInfo"
                        value={t9n.bedInfo}
                        onChange={(e) => updateTranslation(lang, { bedInfo: e.target.value })}
                      />
                      <Input
                        label={`${t('admin.cmsBathroomInfo')} (${lang})`}
                        name="bathroomInfo"
                        value={t9n.bathroomInfo}
                        onChange={(e) => updateTranslation(lang, { bathroomInfo: e.target.value })}
                      />
                      <div>
                        <label className="text-foreground text-sm font-medium">
                          {`${t('admin.cmsFacilities')} (${lang})`}
                        </label>
                        <div className="mt-1.5">
                          <FacilityListEditor
                            value={form.facilities}
                            onChange={(rows) => updateForm({ facilities: rows })}
                            lang={lang}
                            addLabel={t('admin.cmsAddFacility')}
                            labelPlaceholder={t('admin.cmsFacilitiesHint')}
                          />
                        </div>
                      </div>
                      <LabeledTextarea
                        label={`${t('admin.cmsRules')} (${lang})`}
                        value={t9n.rules}
                        onChange={(v) => updateTranslation(lang, { rules: v })}
                        placeholder="Aturan menginap"
                        rows={2}
                      />
                    </div>
                  </div>
                </>
              )}

              {tab === 'gallery' &&
                (isCreating ? (
                  <div className="border-border flex flex-col items-center gap-1.5 rounded-[14px] border border-dashed bg-white px-4 py-12 text-center">
                    <ImagePlus size={26} strokeWidth={1.4} className="text-cream-400" aria-hidden />
                    <p className="text-muted text-[13px]">{t('admin.cmsGallerySaveFirst')}</p>
                  </div>
                ) : (
                  <div className="border-border rounded-[14px] border bg-white p-5">
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {cover && <GalleryThumb image={cover} onDelete={onDeleteImage} />}
                      {rest.map((img) => (
                        <GalleryThumb
                          key={img.id}
                          image={img}
                          onDelete={onDeleteImage}
                          onSetCover={onSetCover}
                        />
                      ))}
                      <label className="border-input hover:border-forest-500 hover:bg-cream-50 text-muted flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed transition-colors">
                        <ImagePlus size={20} strokeWidth={1.6} aria-hidden />
                        <span className="text-[11px] font-medium">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadImage(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-muted mt-3 text-[12px]">{t('admin.cmsGalleryHint')}</p>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Aksi nempel di bawah — dulu tombol Simpan ada di ujung gulungan
            yang panjangnya bisa 3–4 layar. */}
        {!loadingDetail && (
          <div className="border-border border-t bg-white px-5 py-3.5 sm:px-6">
            {error && <p className="mb-2.5 text-[13px] text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={saving}>
                {saving ? t('admin.saving') : t('admin.cmsSave')}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                {t('admin.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryThumb({
  image,
  onDelete,
  onSetCover,
}: {
  image: AdminRoomImage;
  onDelete: (id: number) => void;
  onSetCover?: (id: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'group relative aspect-square overflow-hidden rounded-[10px]',
        image.isCover ? 'border-terracotta-500 border-2' : 'border-border border',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, arbitrary uploaded URL */}
      <img src={resolveImageUrl(image.imageUrl)} alt="" className="h-full w-full object-cover" />
      {image.isCover && (
        <span className="bg-terracotta-500 absolute top-1 left-1 rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold text-white">
          {t('admin.cmsCover')}
        </span>
      )}
      <div className="absolute inset-0 flex items-end justify-end gap-1 bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
        {!image.isCover && onSetCover && (
          <button
            type="button"
            onClick={() => onSetCover(image.id)}
            title={t('admin.cmsSetCover')}
            aria-label={t('admin.cmsSetCover')}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-700 transition-colors hover:text-amber-600"
          >
            <Star size={13} strokeWidth={2} aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(image.id)}
          title={t('admin.delete')}
          aria-label={t('admin.delete')}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#b23b30] transition-colors hover:bg-red-50"
        >
          <Trash2 size={13} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-foreground text-sm font-medium">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-input focus:border-forest-500 focus:ring-forest-500/20 resize-none rounded-[10px] border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
      />
    </div>
  );
}
