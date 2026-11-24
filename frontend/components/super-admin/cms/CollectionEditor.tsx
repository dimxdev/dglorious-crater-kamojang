'use client';

import { ArrowDown, ArrowUp, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  type AdminContentItem,
  type CollectionContent,
  type ContentCollection,
  type Localized,
  createItem,
  deleteItem,
  fetchAdminItems,
  reorderItems,
  resolveContentImage,
  updateItem,
} from '@/lib/api/siteContent';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ErrorBlock, LoadingBlock, CardShell } from './SectionEditor';
import { ImageField, Switch, ghostBtn } from './controls';
import { contentErrors, errorMessage } from '@/lib/validation';
import { useReportDirty } from './dirty';

export type RowSummary = {
  /** Teks utama baris: ID besar, EN redup di bawahnya. */
  title: Localized;
  /** Info singkat tambahan (harga, "Unggulan", jumlah butir). */
  meta?: string;
};

type Props<C extends ContentCollection> = {
  collection: C;
  title: string;
  description?: string;
  addLabel: string;
  emptyText: string;
  /** Nama tunggal item untuk teks aksesibilitas, mis. "FAQ". */
  noun: string;
  summarize: (c: CollectionContent[C]) => RowSummary;
  makeEmpty: () => CollectionContent[C];
  renderForm: (draft: CollectionContent[C], set: (next: CollectionContent[C]) => void) => React.ReactNode;
  /** Koleksi ini punya gambar per item (ATTRACTION, GALLERY). */
  hasImage?: boolean;
  imageLabel?: string;
};

type Editing<C extends ContentCollection> = {
  /** null = item baru */
  id: number | null;
  content: CollectionContent[C];
  imageUrl: string;
  isActive: boolean;
  initial: string;
  saving: boolean;
  error: string | null;
};

export function CollectionEditor<C extends ContentCollection>(props: Props<C>) {
  const { collection, title, description, addLabel, emptyText, noun, summarize, makeEmpty, renderForm, hasImage, imageLabel } =
    props;
  const { t } = useTranslation();
  const { token } = useAuth();
  const [items, setItems] = useState<AdminContentItem<C>[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [editing, setEditing] = useState<Editing<C> | null>(null);
  const [deleting, setDeleting] = useState<AdminContentItem<C> | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAdminItems(token, collection)
      .then((rows) => {
        if (!cancelled) {
          setLoadError(null);
          setItems(rows);
        }
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : t('superAdmin.cms.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [token, collection, nonce, t]);

  const editDirty = !!editing && JSON.stringify([editing.content, editing.imageUrl, editing.isActive]) !== editing.initial;
  useReportDirty(`items:${collection}`, editDirty);

  function snapshot(content: CollectionContent[C], imageUrl: string, isActive: boolean) {
    return JSON.stringify([content, imageUrl, isActive]);
  }

  function openCreate() {
    const content = makeEmpty();
    setEditing({ id: null, content, imageUrl: '', isActive: true, initial: snapshot(content, '', true), saving: false, error: null });
  }

  function openEdit(item: AdminContentItem<C>) {
    const content = structuredClone(item.content);
    const img = item.imageUrl ?? '';
    setEditing({
      id: item.id,
      content,
      imageUrl: img,
      isActive: item.isActive,
      initial: snapshot(content, img, item.isActive),
      saving: false,
      error: null,
    });
  }

  function closeEditing() {
    if (editing?.saving) return;
    if (editDirty && !window.confirm(t('superAdmin.cms.discardConfirm'))) return;
    setEditing(null);
  }

  const imageMissing = hasImage && !!editing && !editing.imageUrl;
  const editInvalid = imageMissing ? t('superAdmin.cms.imageRequired') : editing ? contentErrors(editing.content, t) : null;

  async function saveEditing() {
    if (!token || !editing || editInvalid) return;
    setEditing({ ...editing, saving: true, error: null });
    try {
      if (editing.id === null) {
        const created = await createItem(token, {
          collection,
          content: editing.content,
          ...(hasImage && editing.imageUrl ? { imageUrl: editing.imageUrl } : {}),
          isActive: editing.isActive,
        });
        setItems((prev) => [...(prev ?? []), created]);
      } else {
        const id = editing.id;
        const updated = await updateItem<C>(token, id, {
          content: editing.content,
          ...(hasImage ? { imageUrl: editing.imageUrl || null } : {}),
          isActive: editing.isActive,
        });
        setItems((prev) => prev?.map((x) => (x.id === id ? updated : x)) ?? prev);
      }
      setEditing(null);
    } catch (e) {
      setEditing((cur) =>
        cur ? { ...cur, saving: false, error: errorMessage(e, t('admin.saveError')) } : cur,
      );
    }
  }

  async function toggleActive(item: AdminContentItem<C>, next: boolean) {
    if (!token) return;
    setBusy(true);
    setRowError(null);
    try {
      const updated = await updateItem<C>(token, item.id, { isActive: next });
      setItems((prev) => prev?.map((x) => (x.id === item.id ? updated : x)) ?? prev);
      setAnnounce(next ? t('superAdmin.cms.nowVisible') : t('superAdmin.cms.nowHidden'));
    } catch (e) {
      setRowError(e instanceof Error ? e.message : t('admin.saveError'));
    } finally {
      setBusy(false);
    }
  }

  const move = useCallback(
    async (index: number, dir: -1 | 1) => {
      if (!token || !items) return;
      const target = index + dir;
      if (target < 0 || target >= items.length) return;
      const next = items.slice();
      const [it] = next.splice(index, 1);
      next.splice(target, 0, it);
      const previous = items;
      setItems(next); // optimistis, dibalikkan bila gagal
      setBusy(true);
      setRowError(null);
      try {
        const saved = await reorderItems(
          token,
          collection,
          next.map((x) => x.id),
        );
        setItems(saved);
        setAnnounce(t('superAdmin.cms.movedTo', { n: target + 1, total: next.length }));
      } catch (e) {
        setItems(previous);
        setRowError(e instanceof Error ? e.message : t('superAdmin.cms.reorderError'));
      } finally {
        setBusy(false);
      }
    },
    [token, items, collection, t],
  );

  async function confirmDelete() {
    if (!token || !deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteItem(token, deleting.id);
      setItems((prev) => prev?.filter((x) => x.id !== deleting.id) ?? prev);
      setDeleting(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t('admin.deleteError'));
    } finally {
      setDeleteBusy(false);
    }
  }

  const visibleCount = useMemo(() => items?.filter((i) => i.isActive).length ?? 0, [items]);
  const deletingName = deleting ? summarize(deleting.content).title.id : '';

  return (
    <CardShell
      id={`c-${collection}`}
      title={title}
      description={description}
      actions={
        <button
          type="button"
          onClick={openCreate}
          disabled={!items}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-green-700 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} strokeWidth={2.2} aria-hidden />
          {addLabel}
        </button>
      }
    >
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      {loadError && <ErrorBlock message={loadError} onRetry={() => { setLoadError(null); setItems(null); setNonce((n) => n + 1); }} />}
      {!loadError && items === null && <LoadingBlock label={t('superAdmin.cms.loading')} />}
      {!loadError && items?.length === 0 && (
        <p className="text-muted rounded-xl border border-dashed border-[#d9d3c2] px-4 py-8 text-center text-[13.5px]">
          {emptyText}
        </p>
      )}

      {items && items.length > 0 && (
        <>
          <p className="text-muted mb-3 text-[12.5px]">
            {t('superAdmin.cms.countSummary', { n: items.length, shown: visibleCount })}
          </p>
          <ol className="flex flex-col gap-2.5">
            {items.map((item, i) => {
              const s = summarize(item.content);
              const enEmpty = s.title.en.trim() === '';
              return (
                <li
                  key={item.id}
                  className={cn(
                    'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[#ece6d8] bg-[#fbf9f4] p-3',
                    !item.isActive && 'bg-stone-50',
                  )}
                >
                  {hasImage && (
                    <div className="h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-stone-200">
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- pratinjau dari upload backend
                        <img
                          src={resolveContentImage(item.imageUrl)}
                          alt=""
                          width={72}
                          height={56}
                          className={cn('h-full w-full object-cover', !item.isActive && 'opacity-50')}
                        />
                      )}
                    </div>
                  )}
                  <div className={cn('min-w-0 flex-1 basis-48', !item.isActive && 'opacity-70')}>
                    <div className="text-foreground truncate text-[14px] font-semibold">{s.title.id || '—'}</div>
                    <div className="text-muted truncate text-[12.5px]">
                      {enEmpty ? <span className="italic">{t('superAdmin.cms.enEmptyShort')}</span> : s.title.en}
                    </div>
                    {(s.meta || !item.isActive) && (
                      <div className="text-muted-strong mt-1 flex flex-wrap items-center gap-x-3 text-[12px]">
                        {s.meta && <span>{s.meta}</span>}
                        {!item.isActive && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <EyeOff size={12} strokeWidth={1.75} aria-hidden />
                            {t('superAdmin.cms.hidden')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Switch
                      checked={item.isActive}
                      onChange={(v) => void toggleActive(item, v)}
                      disabled={busy}
                      label={t('superAdmin.cms.showOnSiteNamed', { name: s.title.id })}
                      hideLabel
                    />
                    <button
                      type="button"
                      className={ghostBtn}
                      disabled={busy || i === 0}
                      onClick={() => void move(i, -1)}
                      aria-label={t('superAdmin.cms.moveUpNamed', { name: s.title.id })}
                    >
                      <ArrowUp size={15} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={ghostBtn}
                      disabled={busy || i === items.length - 1}
                      onClick={() => void move(i, 1)}
                      aria-label={t('superAdmin.cms.moveDownNamed', { name: s.title.id })}
                    >
                      <ArrowDown size={15} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={cn(ghostBtn, 'border border-[#c9c3b3] bg-white')}
                      onClick={() => openEdit(item)}
                      aria-label={t('superAdmin.cms.editNamed', { name: s.title.id })}
                    >
                      <Pencil size={14} strokeWidth={1.75} aria-hidden />
                      {t('admin.edit')}
                    </button>
                    <button
                      type="button"
                      className={cn(ghostBtn, 'text-red-700 hover:bg-red-50')}
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(item);
                      }}
                      aria-label={t('superAdmin.cms.deleteNamed', { name: s.title.id })}
                    >
                      <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {rowError && (
            <div className="mt-3">
              <ErrorBlock message={rowError} />
            </div>
          )}
        </>
      )}

      <Modal
        open={!!editing}
        onClose={closeEditing}
        title={editing?.id === null ? t('superAdmin.cms.addTitle', { noun }) : t('superAdmin.cms.editTitle', { noun })}
        className="max-w-2xl"
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveEditing();
            }}
          >
            <div className="flex max-h-[68vh] flex-col gap-5 overflow-y-auto pr-1">
              {renderForm(editing.content, (next) => setEditing((cur) => (cur ? { ...cur, content: next } : cur)))}
              {hasImage && (
                <ImageField
                  label={imageLabel ?? t('superAdmin.cms.imageLabel')}
                  value={editing.imageUrl || null}
                  hint={imageMissing ? t('superAdmin.cms.imageRequired') : undefined}
                  onChange={(url) => setEditing((cur) => (cur ? { ...cur, imageUrl: url } : cur))}
                />
              )}
              <Switch
                checked={editing.isActive}
                onChange={(v) => setEditing((cur) => (cur ? { ...cur, isActive: v } : cur))}
                label={t('superAdmin.cms.showOnSite')}
              />
              {editInvalid && <ErrorBlock message={editInvalid} />}
              {editing.error && <ErrorBlock message={editing.error} />}
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-[#f1ecdf] pt-4">
              <button type="button" className={cn(ghostBtn, 'h-10 px-4')} onClick={closeEditing} disabled={editing.saving}>
                {t('admin.cancel')}
              </button>
              <button
                type="submit"
                disabled={editing.saving || !!editInvalid}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-green-700 px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editing.saving ? t('superAdmin.cms.saving') : t('superAdmin.cms.save')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => (deleteBusy ? undefined : setDeleting(null))}
        title={t('superAdmin.cms.deleteTitle', { noun })}
      >
        <p className="text-[14px] leading-relaxed">{t('superAdmin.cms.deleteConfirm', { name: deletingName })}</p>
        <p className="text-muted mt-1.5 text-[12.5px]">{t('superAdmin.cms.deleteHint')}</p>
        {deleteError && (
          <div className="mt-3">
            <ErrorBlock message={deleteError} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={cn(ghostBtn, 'h-10 px-4')} onClick={() => setDeleting(null)} disabled={deleteBusy}>
            {t('admin.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleteBusy}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-red-700 px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteBusy ? t('admin.deleting') : t('admin.delete')}
          </button>
        </div>
      </Modal>
    </CardShell>
  );
}
