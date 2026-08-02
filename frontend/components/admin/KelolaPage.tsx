'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge, Button, ImagePlaceholder, Input, Modal, Select } from '@/components/ui';
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
import { formatIDR } from '@/lib/format';
import type { IconName } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { FacilityListEditor, type FacilityRow } from './FacilityListEditor';

// Fase 1 cuma ID (wajib) + EN (opsional) — 中文 belum ada tempat penyimpanannya
// di backend (`RoomTypeTranslationsDto` cuma `id`/`en`), jangan bikin tab palsu.
const LANGS = ['ID', 'EN'] as const;
type Lang = (typeof LANGS)[number];

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
    setDrawer({ form: emptyForm(), lang: 'ID', loadingDetail: false, saving: false, error: null });
  }

  async function openEdit(id: number) {
    if (!token) return;
    setDrawer({ form: emptyForm(), lang: 'ID', loadingDetail: true, saving: false, error: null });
    try {
      const detail = await fetchAdminRoomType(token, id);
      setDrawer({ form: detailToForm(detail), lang: 'ID', loadingDetail: false, saving: false, error: null });
    } catch (e) {
      setDrawer((d) =>
        d ? { ...d, loadingDetail: false, error: e instanceof ApiError ? e.message : t('admin.loadError') } : d,
      );
    }
  }

  async function handleSave() {
    if (!drawer || !token) return;
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
      setDrawer({ form: detailToForm(detail), lang: drawer.lang, loadingDetail: false, saving: false, error: null });
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
      // First image also becomes the cover (backend rule) — table thumbnail needs it too.
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
      // Table thumbnail shows the cover — needs refreshing too, not just the drawer.
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

  return (
    <DashboardLayout title={t('dashboard.manage')}>
      <div className="flex items-center justify-between">
        <div className="text-muted text-sm">
          {rooms ? t('admin.activeCount', { n: rooms.filter((r) => r.isActive).length }) : t('admin.loading')}
        </div>
        <Button className="rounded-xl" onClick={openCreate}>
          {t('admin.addRoom')}
        </Button>
      </div>

      {/* Table */}
      <div className="border-border mt-4 overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead className="bg-cream-100 text-muted text-[11px] uppercase">
              <tr>
                <th className="px-4 py-3.5">{t('admin.photo')}</th>
                <th className="px-4 py-3.5">{t('admin.name')}</th>
                <th className="px-4 py-3.5">{t('admin.category')}</th>
                <th className="px-4 py-3.5">{t('admin.priceWeekday')}</th>
                <th className="px-4 py-3.5">{t('admin.priceWeekend')}</th>
                <th className="px-4 py-3.5">{t('admin.capacity')}</th>
                <th className="px-4 py-3.5">{t('admin.unit')}</th>
                <th className="px-4 py-3.5">{t('admin.tStatus')}</th>
                <th className="px-4 py-3.5">{t('admin.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {listError && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <p className="text-sm text-red-600">{listError}</p>
                    <button
                      onClick={() => void refreshList()}
                      className="text-forest-700 mt-2 text-sm font-semibold underline"
                    >
                      {t('admin.retry')}
                    </button>
                  </td>
                </tr>
              )}
              {!listError && rooms === null && (
                <tr>
                  <td colSpan={9} className="text-muted px-4 py-8 text-center text-sm">
                    {t('admin.loading')}
                  </td>
                </tr>
              )}
              {!listError && rooms?.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-muted px-4 py-8 text-center text-sm">
                    {t('admin.noRooms')}
                  </td>
                </tr>
              )}
              {rooms?.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="h-10.5 w-14 overflow-hidden rounded-lg">
                      {r.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, arbitrary uploaded/external URLs
                        <img
                          src={resolveImageUrl(r.coverImageUrl)}
                          alt={r.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImagePlaceholder icon="🏕️" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="text-muted px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3">{formatIDR(r.priceWeekday)}</td>
                  <td className="px-4 py-3">{formatIDR(r.priceWeekend)}</td>
                  <td className="text-muted px-4 py-3">{r.capacity} tamu</td>
                  <td className="text-muted px-4 py-3">{r.totalUnits}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.isActive ? 'success' : 'neutral'}>
                      {r.isActive ? t('admin.active') : t('admin.inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void openEdit(r.id)}
                      className="mr-3 font-semibold text-[#2c5a8a]"
                    >
                      {t('admin.edit')}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="font-semibold text-[#b23b30]"
                    >
                      {t('admin.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <Modal open={!!deleteTarget} onClose={() => (deleting ? undefined : setDeleteTarget(null))} title={t('admin.delete')}>
        <p className="text-sm">{deleteTarget && t('admin.deleteConfirm', { name: deleteTarget.name })}</p>
        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="danger" className="rounded-xl" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? t('admin.deleting') : t('admin.delete')}
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('admin.cancel')}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
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
  const { form, lang, loadingDetail, saving, error } = state;
  const isCreating = form.id == null;

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

  const t9n = form.translations[lang];
  const cover = form.images.find((i) => i.isCover);
  const rest = form.images.filter((i) => !i.isCover);

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <button aria-hidden tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#141916]/50" />
      <div className="relative z-10 flex h-screen w-[560px] max-w-full flex-col bg-[#f4f1ea] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e2d5] bg-white px-6 py-4.5">
          <div className="font-serif text-xl font-bold">{t('admin.cmsTitle')}</div>
          <button onClick={onClose} className="text-xl text-[#999]" aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingDetail ? (
            <p className="text-muted text-sm">{t('admin.loading')}</p>
          ) : (
            <>
              {/* Universal — termasuk slug (create-only) & harga/kapasitas */}
              <div className="text-muted text-xs font-semibold tracking-[0.06em] uppercase">
                {t('admin.cmsUniversal')}
              </div>
              <div className="border-border mt-2.5 grid grid-cols-2 gap-3.5 rounded-[14px] border bg-white p-5">
                {isCreating ? (
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Input
                      label={t('admin.cmsSlug')}
                      name="slug"
                      value={form.slug}
                      onChange={(e) => updateForm({ slug: e.target.value })}
                      placeholder="eagle-hill"
                    />
                    <span className="text-muted text-xs">{t('admin.cmsSlugHint')}</span>
                  </div>
                ) : (
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Input label={t('admin.cmsSlug')} name="slug" value={form.slug} disabled />
                    <span className="text-muted text-xs">{t('admin.cmsSlugHint')}</span>
                  </div>
                )}
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

              {/* Multi-language */}
              <div className="text-muted mt-5.5 text-xs font-semibold tracking-[0.06em] uppercase">
                {t('admin.cmsMultiLang')}
              </div>
              <div className="mt-2.5 flex gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={
                      'rounded-[10px] border px-4.5 py-2 text-[13px] font-semibold ' +
                      (lang === l ? 'border-forest-700 bg-forest-700 text-white' : 'border-border bg-white')
                    }
                  >
                    {l}
                  </button>
                ))}
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

              {/* Gallery */}
              <div className="text-muted mt-5.5 text-xs font-semibold tracking-[0.06em] uppercase">
                {t('admin.cmsGallery')}
              </div>
              {isCreating ? (
                <p className="text-muted mt-2.5 text-sm">{t('admin.cmsGallerySaveFirst')}</p>
              ) : (
                <div className="mt-2.5 grid grid-cols-4 gap-2.5">
                  {cover && <GalleryThumb image={cover} onDelete={onDeleteImage} />}
                  {rest.map((img) => (
                    <GalleryThumb key={img.id} image={img} onDelete={onDeleteImage} onSetCover={onSetCover} />
                  ))}
                  <label className="border-input flex aspect-square cursor-pointer items-center justify-center rounded-[10px] border border-dashed text-2xl text-[#c9b795] hover:border-forest-500">
                    +
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
              )}

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex gap-3 pb-4">
                <Button className="rounded-xl" onClick={onSave} disabled={saving}>
                  {saving ? t('admin.saving') : t('admin.cmsSave')}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={saving}>
                  {t('admin.cancel')}
                </Button>
              </div>
            </>
          )}
        </div>
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
      className={
        'group relative aspect-square overflow-hidden rounded-[10px] ' +
        (image.isCover ? 'border-terracotta-500 border-2' : 'border-border border')
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, arbitrary uploaded URL */}
      <img src={resolveImageUrl(image.imageUrl)} alt="" className="h-full w-full object-cover" />
      {image.isCover && (
        <span className="bg-terracotta-500 absolute top-1 left-1 rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold text-white">
          {t('admin.cmsCover')}
        </span>
      )}
      <div className="absolute inset-0 flex items-end justify-end gap-1 bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
        {!image.isCover && onSetCover && (
          <button
            type="button"
            onClick={() => onSetCover(image.id)}
            title={t('admin.cmsSetCover')}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs"
          >
            ★
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(image.id)}
          title={t('admin.delete')}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-[#b23b30]"
        >
          ×
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
