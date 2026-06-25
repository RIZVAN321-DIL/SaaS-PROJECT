'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Copy, Check, Plus, ChevronLeft, Trash2, AlertTriangle } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { usersApi } from '@/lib/api';
import { getAccessToken, getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface CreatedUserResult extends TeamMember {
  temporaryPassword: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  LAWYER: 'Юрист',
  ASSISTANT: 'Помощник',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-primary/10 text-primary',
  ADMIN: 'bg-amber-500/10 text-amber-600',
  LAWYER: 'bg-emerald-500/10 text-emerald-600',
  ASSISTANT: 'bg-muted text-muted-foreground',
};

const INVITABLE_ROLES = ['ADMIN', 'LAWYER', 'ASSISTANT'];

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function TeamSettingsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const canManage =
    currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Инвайт
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('LAWYER');
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Удаление
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadMembers() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await usersApi.getAll(token);
      setMembers(data as TeamMember[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMembers(); }, []);

  // =========================
  // INVITE
  // =========================
  function openInviteForm() {
    setEmail('');
    setRole('LAWYER');
    setInviteError('');
    setCreatedUser(null);
    setCopied(false);
    setShowInviteForm(true);
  }

  function closeInviteModal() {
    setShowInviteForm(false);
    if (createdUser) loadMembers();
  }

  async function handleInviteSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) { setInviteError('Требуется авторизация'); return; }
    setSubmitting(true);
    setInviteError('');
    try {
      const result = await usersApi.create({ email, role }, token);
      setCreatedUser(result as CreatedUserResult);
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : 'Не удалось пригласить сотрудника',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCredentials() {
    if (!createdUser) return;
    const text = `Email: ${createdUser.email}\nВременный пароль: ${createdUser.temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  // =========================
  // DELETE
  // =========================
  async function confirmDelete() {
    if (!memberToDelete) return;
    const token = getAccessToken();
    if (!token) return;

    setDeleting(true);
    try {
      await usersApi.remove(memberToDelete.id, token);
      toast.success(`Сотрудник ${memberToDelete.email} удалён`);
      setMemberToDelete(null);
      loadMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Не удалось удалить сотрудника',
      );
    } finally {
      setDeleting(false);
    }
  }

  // Показывать ли кнопку удаления для конкретного участника
  function canDelete(member: TeamMember): boolean {
    if (!canManage) return false;
    if (member.role === 'OWNER') return false;
    if (member.id === currentUser?.userId) return false;
    return true;
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} /> Настройки
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Команда</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Сотрудники вашей организации
            </p>
          </div>
          {canManage && (
            <Button onClick={openInviteForm} className="h-9 px-3 text-sm">
              <Plus size={14} /> Пригласить сотрудника
            </Button>
          )}
        </div>

        {/* ===== МОДАЛКА ПРИГЛАШЕНИЯ ===== */}
        <Modal
          open={showInviteForm}
          onClose={closeInviteModal}
          title={createdUser ? 'Сотрудник добавлен' : 'Пригласить сотрудника'}
        >
          {createdUser ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Аккаунт создан. Передайте эти данные сотруднику — повторно пароль
                показан не будет.
              </p>
              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </div>
                  <div className="mt-0.5 font-mono text-sm">{createdUser.email}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Временный пароль
                  </div>
                  <div className="mt-0.5 font-mono text-sm">
                    {createdUser.temporaryPassword}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={copyCredentials}
                className="w-full"
              >
                {copied ? (
                  <><Check size={14} /> Скопировано</>
                ) : (
                  <><Copy size={14} /> Скопировать данные</>
                )}
              </Button>
              <Button type="button" onClick={closeInviteModal} className="w-full">
                Готово
              </Button>
            </div>
          ) : (
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <Input
                label="Email сотрудника"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lawyer@firma.ru"
              />
              <div>
                <label className="mb-2 block text-sm font-medium">Роль</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              {inviteError && (
                <div className="rounded-xl border border-red-500/30 p-3 text-sm text-red-500">
                  {inviteError}
                </div>
              )}
              <Button type="submit" loading={submitting} className="w-full">
                Создать аккаунт
              </Button>
            </form>
          )}
        </Modal>

        {/* ===== МОДАЛКА ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ===== */}
        <Modal
          open={!!memberToDelete}
          onClose={() => { if (!deleting) setMemberToDelete(null); }}
          title="Удалить сотрудника?"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p className="font-medium">{memberToDelete?.email}</p>
                <p className="mt-1 text-muted-foreground">
                  Сотрудник будет удалён из организации. Задачи, назначенные на
                  него, останутся, но станут неназначенными. Это действие нельзя
                  отменить.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setMemberToDelete(null)}
                disabled={deleting}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={confirmDelete}
                loading={deleting}
              >
                <Trash2 size={14} /> Удалить
              </Button>
            </div>
          </div>
        </Modal>

        {/* ===== ТАБЛИЦА СОТРУДНИКОВ ===== */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Сотрудник
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Роль
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  В команде с
                </th>
                {canManage && (
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {[1, 2, 3, 4].map((j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="py-16 text-center">
                    <Users size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      В организации пока нет сотрудников
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials(member.email)}
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {member.email}
                          </span>
                          {member.id === currentUser?.userId && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              Вы
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          ROLE_COLORS[member.role] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    {canManage && (
                      <td className="p-4 text-right">
                        {canDelete(member) ? (
                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-red-500/50 hover:text-red-500"
                            title="Удалить сотрудника"
                          >
                            <Trash2 size={12} />
                            Удалить
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!canManage && (
          <p className="text-xs text-muted-foreground">
            Управлять сотрудниками может только владелец или администратор организации.
          </p>
        )}
      </div>
    </AppShell>
  );
}
