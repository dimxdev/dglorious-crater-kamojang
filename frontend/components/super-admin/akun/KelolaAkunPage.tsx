'use client';

import { Check, KeyRound, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Input, Modal, PasswordFields, Select } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  type AdminUser,
  createUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleLabelKey } from '@/lib/auth/roleLabel';
import type { RoleName } from '@/lib/auth/types';
import { cn } from '@/lib/cn';
import { formatDate, initials } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { accountNameError, confirmError, emailError, errorMessage, passwordError } from '@/lib/validation';
import { ErrorBlock, LoadingBlock } from '../cms/SectionEditor';
import { Switch } from '../cms/controls';
import { SuperAdminLayout } from '../SuperAdminLayout';

const ROLES: RoleName[] = ['SUPER_ADMIN', 'OWNER', 'ADMIN_PENGINAPAN'];
const ROLE_TONE = { SUPER_ADMIN: 'info', OWNER: 'terracotta', ADMIN_PENGINAPAN: 'forest' } as const;

type ModalState =
  | { kind: 'create' }
  | { kind: 'edit'; user: AdminUser }
  | { kind: 'reset'; user: AdminUser }
  | { kind: 'delete'; user: AdminUser }
  | null;

const iconBtn =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-muted-strong ' +
  'transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent lg:min-h-9 lg:w-9 lg:px-0';

export function KelolaAkunPage() {
  const { t } = useTranslation();
  return (
    <SuperAdminLayout
      wide
      group={t('superAdmin.nav.groupSystem')}
      title={t('superAdmin.nav.accounts')}
      description={t('superAdmin.accounts.desc')}
    >
      <AccountManager />
    </SuperAdminLayout>
  );
}

function AccountManager() {
  const { t } = useTranslation();
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setUsers(await fetchUsers(token));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : t('superAdmin.accounts.loadError'));
    }
  }, [token, t]);

  // Pemuatan awal: setState hanya di dalam callback promise, bukan sinkron di
  // badan effect (`load` tetap dipakai setelah aksi pada akun).
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchUsers(token)
      .then((list) => {
        if (!active) return;
        setUsers(list);
        setLoadError(null);
      })
      .catch((e) => {
        if (active)
          setLoadError(
            e instanceof ApiError ? e.message : t('superAdmin.accounts.loadError'),
          );
      });
    return () => {
      active = false;
    };
  }, [token, t]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const activeCount = useMemo(() => users?.filter((u) => u.isActive).length ?? 0, [users]);

  function done(message: string) {
    setModal(null);
    setNotice(message);
    void load();
  }

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13.5px] font-semibold">
          {users
            ? t('superAdmin.accounts.summary', { n: users.length, active: activeCount })
            : t('admin.loading')}
        </div>
        <Button onClick={() => setModal({ kind: 'create' })}>
          <Plus size={15} strokeWidth={2.2} aria-hidden />
          {t('superAdmin.accounts.add')}
        </Button>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-[13px] font-medium text-green-900"
        >
          <Check size={15} strokeWidth={2.5} className="shrink-0" aria-hidden />
          {notice}
        </p>
      )}

      <div className="mt-4">
        {loadError && <ErrorBlock message={loadError} onRetry={() => { setLoadError(null); void load(); }} />}
        {!loadError && !users && <LoadingBlock label={t('admin.loading')} />}
        {!loadError && users?.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#ece6d8] bg-white px-4 py-14 text-center">
            <Users size={30} strokeWidth={1.4} className="text-cream-400" aria-hidden />
            <p className="text-[13.5px] font-semibold">{t('superAdmin.accounts.emptyTitle')}</p>
            <p className="text-muted text-[12.5px]">{t('superAdmin.accounts.emptyHint')}</p>
            <Button className="mt-2" size="sm" onClick={() => setModal({ kind: 'create' })}>
              <Plus size={14} strokeWidth={2.2} aria-hidden />
              {t('superAdmin.accounts.add')}
            </Button>
          </div>
        )}
        {users && users.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#ece6d8] bg-white">
            <div
              className="text-muted hidden border-b border-[#f1ecdf] bg-[#fbf9f4] px-5 py-2.5 text-[12.5px] font-semibold lg:grid lg:grid-cols-[minmax(0,1fr)_9.5rem_6.5rem_7.5rem] lg:gap-4"
            >
              <span>{t('superAdmin.accounts.colAccount')}</span>
              <span>{t('superAdmin.accounts.colRole')}</span>
              <span>{t('superAdmin.accounts.colStatus')}</span>
              <span className="text-right">{t('superAdmin.accounts.colActions')}</span>
            </div>
            <ul className="divide-y divide-[#f1ecdf]">
              {users.map((u) => (
                <AccountRow
                  key={u.id}
                  account={u}
                  isSelf={u.id === me?.id}
                  onEdit={() => setModal({ kind: 'edit', user: u })}
                  onReset={() => setModal({ kind: 'reset', user: u })}
                  onDelete={() => setModal({ kind: 'delete', user: u })}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {modal?.kind === 'create' && (
        <CreateModal
          onClose={closeModal}
          onDone={(u) => done(t('superAdmin.accounts.created', { name: u.name }))}
        />
      )}
      {modal?.kind === 'edit' && (
        <EditModal
          account={modal.user}
          isSelf={modal.user.id === me?.id}
          onClose={closeModal}
          onDone={(u) => done(t('superAdmin.accounts.updated', { name: u.name }))}
        />
      )}
      {modal?.kind === 'reset' && (
        <ResetModal
          account={modal.user}
          onClose={closeModal}
          onDone={() => done(t('superAdmin.accounts.passwordReset', { name: modal.user.name }))}
        />
      )}
      {modal?.kind === 'delete' && (
        <DeleteModal
          account={modal.user}
          onClose={closeModal}
          onDone={() => done(t('superAdmin.accounts.deleted', { name: modal.user.name }))}
        />
      )}
    </>
  );
}

function AccountRow({
  account,
  isSelf,
  onEdit,
  onReset,
  onDelete,
}: {
  account: AdminUser;
  isSelf: boolean;
  onEdit: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const name = account.name;
  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-4 py-4 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_9.5rem_6.5rem_7.5rem] lg:items-center lg:gap-4',
        !account.isActive && 'bg-[#fbf9f4]',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            account.isActive ? 'bg-[#0f172a] text-sky-400' : 'bg-stone-200 text-stone-600',
          )}
          aria-hidden
        >
          {initials(name)}
        </span>
        <div className="min-w-0">
          <div className={cn('flex items-center gap-2 text-[14px] font-semibold', !account.isActive && 'text-muted-strong')}>
            <span className="truncate">{name}</span>
            {isSelf && (
              <span className="shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800">
                {t('superAdmin.accounts.you')}
              </span>
            )}
          </div>
          <div className="text-muted truncate text-[12.5px]">{account.email}</div>
          <div className="text-muted mt-0.5 text-[12px]">
            {t('superAdmin.accounts.colUpdated')} {formatDate(account.updatedAt)}
          </div>
          {isSelf && <p className="text-muted mt-1 text-[12px] leading-snug">{t('superAdmin.accounts.selfNote')}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 lg:contents">
        <Badge tone={ROLE_TONE[account.role]}>{t(roleLabelKey(account.role))}</Badge>
        <Badge tone={account.isActive ? 'success' : 'neutral'}>
          {account.isActive ? t('superAdmin.accounts.active') : t('superAdmin.accounts.inactive')}
        </Badge>
      </div>

      <div className="-ml-3 flex flex-wrap items-center gap-1 lg:ml-0 lg:justify-end lg:gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('superAdmin.accounts.editNamed', { name })}
          title={t('superAdmin.accounts.edit')}
          className={iconBtn}
        >
          <Pencil size={15} strokeWidth={1.9} aria-hidden />
          <span className="lg:sr-only">{t('superAdmin.accounts.edit')}</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label={t('superAdmin.accounts.resetPasswordNamed', { name })}
          title={t('superAdmin.accounts.resetPassword')}
          className={iconBtn}
        >
          <KeyRound size={15} strokeWidth={1.9} aria-hidden />
          <span className="lg:sr-only">{t('superAdmin.accounts.resetPassword')}</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isSelf}
          aria-label={t('superAdmin.accounts.deleteNamed', { name })}
          title={isSelf ? t('superAdmin.accounts.selfDeleteTitle') : t('superAdmin.accounts.delete')}
          className={cn(iconBtn, !isSelf && 'text-red-700 hover:bg-red-50')}
        >
          <Trash2 size={15} strokeWidth={1.9} aria-hidden />
          <span className="lg:sr-only">{t('superAdmin.accounts.delete')}</span>
        </button>
      </div>
    </li>
  );
}

/* ── Modal: tambah akun ─────────────────────────────────────── */

function useRoleOptions() {
  const { t } = useTranslation();
  return ROLES.map((r) => ({ value: r, label: t(roleLabelKey(r)) }));
}

function useApiError() {
  const { t } = useTranslation();
  return (e: unknown) => errorMessage(e, t('superAdmin.accounts.genericError'));
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: (u: AdminUser) => void }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const roleOptions = useRoleOptions();
  const apiError = useApiError();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleName>('ADMIN_PENGINAPAN');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || saving) return;
    const next: typeof errors = {};
    const nameErr = accountNameError(name, t);
    if (nameErr) next.name = nameErr;
    const emailErr = emailError(email, t);
    if (emailErr) next.email = emailErr;
    const pwErr = passwordError(password, t, email);
    if (pwErr) next.password = pwErr;
    else {
      const cErr = confirmError(password, confirm, t);
      if (cErr) next.confirm = cErr;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      onDone(await createUser(token, { name: name.trim(), email: email.trim().toLowerCase(), role, password }));
    } catch (err) {
      setFormError(apiError(err));
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title={t('superAdmin.accounts.createTitle')}>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        <Input
          label={t('superAdmin.accounts.name')}
          value={name}
          maxLength={100}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />
        <Input
          label={t('superAdmin.accounts.email')}
          type="email"
          value={email}
          autoComplete="off"
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Select
          label={t('superAdmin.accounts.role')}
          options={roleOptions}
          value={role}
          onChange={(e) => setRole(e.target.value as RoleName)}
        />
        <PasswordFields
          password={password}
          confirm={confirm}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          passwordLabel={t('superAdmin.accounts.password')}
          confirmLabel={t('validation.confirmPassword')}
          passwordError={errors.password}
          confirmError={errors.confirm}
        />
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-800">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap gap-2.5">
          <Button type="submit" disabled={saving}>
            {saving ? t('superAdmin.accounts.creating') : t('superAdmin.accounts.create')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('admin.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal: ubah akun ───────────────────────────────────────── */

function EditModal({
  account,
  isSelf,
  onClose,
  onDone,
}: {
  account: AdminUser;
  isSelf: boolean;
  onClose: () => void;
  onDone: (u: AdminUser) => void;
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const roleOptions = useRoleOptions();
  const apiError = useApiError();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [role, setRole] = useState<RoleName>(account.role);
  const [isActive, setIsActive] = useState(account.isActive);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || saving) return;
    const next: typeof errors = {};
    const nameErr = accountNameError(name, t);
    if (nameErr) next.name = nameErr;
    const emailErr = emailError(email, t);
    if (emailErr) next.email = emailErr;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      onDone(await updateUser(token, account.id, { name: name.trim(), email: email.trim().toLowerCase(), role, isActive }));
    } catch (err) {
      setFormError(apiError(err));
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title={t('superAdmin.accounts.editTitle')}>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        <Input
          label={t('superAdmin.accounts.name')}
          value={name}
          maxLength={100}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label={t('superAdmin.accounts.email')}
          type="email"
          value={email}
          autoComplete="off"
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Select
          label={t('superAdmin.accounts.role')}
          options={roleOptions}
          value={role}
          disabled={isSelf}
          onChange={(e) => setRole(e.target.value as RoleName)}
        />
        <div>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            disabled={isSelf}
            label={t('superAdmin.accounts.activeLabel')}
          />
          <p className="text-muted mt-1 text-[12px] leading-snug">
            {isSelf ? t('superAdmin.accounts.selfRoleHint') : t('superAdmin.accounts.activeHint')}
          </p>
        </div>
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-800">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap gap-2.5">
          <Button type="submit" disabled={saving}>
            {saving ? t('superAdmin.accounts.saving') : t('superAdmin.accounts.save')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('admin.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal: atur ulang kata sandi ───────────────────────────── */

function ResetModal({
  account,
  onClose,
  onDone,
}: {
  account: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const apiError = useApiError();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [confirmErr, setConfirmErr] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || saving) return;
    const pwErr = passwordError(password, t, account.email);
    const cErr = pwErr ? null : confirmError(password, confirm, t);
    setError(pwErr ?? undefined);
    setConfirmErr(cErr ?? undefined);
    if (pwErr || cErr) return;
    setSaving(true);
    setFormError(null);
    try {
      await resetUserPassword(token, account.id, password);
      onDone();
    } catch (err) {
      setFormError(apiError(err));
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title={t('superAdmin.accounts.resetTitle')}>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed">{t('superAdmin.accounts.resetDesc', { name: account.name })}</p>
        <PasswordFields
          password={password}
          confirm={confirm}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          passwordLabel={t('superAdmin.accounts.newPassword')}
          confirmLabel={t('validation.confirmPassword')}
          passwordError={error}
          confirmError={confirmErr}
          autoFocus
        />
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-800">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap gap-2.5">
          <Button type="submit" disabled={saving}>
            {saving ? t('superAdmin.accounts.saving') : t('superAdmin.accounts.resetSubmit')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('admin.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal: hapus akun ──────────────────────────────────────── */

function DeleteModal({
  account,
  onClose,
  onDone,
}: {
  account: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const apiError = useApiError();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!token || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(token, account.id);
      onDone();
    } catch (err) {
      setError(apiError(err));
      setDeleting(false);
    }
  }

  return (
    <Modal open onClose={deleting ? () => undefined : onClose} title={t('superAdmin.accounts.deleteTitle')}>
      <p className="text-sm leading-relaxed">
        {t('superAdmin.accounts.deleteConfirm', { name: account.name, email: account.email })}
      </p>
      <p className="text-muted mt-2 text-[12.5px] leading-snug">{t('superAdmin.accounts.deleteHint')}</p>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-800">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button variant="danger" onClick={() => void confirm()} disabled={deleting}>
          {deleting ? t('superAdmin.accounts.deleting') : t('superAdmin.accounts.deleteSubmit')}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={deleting}>
          {t('admin.cancel')}
        </Button>
      </div>
    </Modal>
  );
}
