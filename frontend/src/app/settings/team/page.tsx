'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { usersApi } from '@/lib/api';
import { getAccessToken, getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

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

const INVITABLE_ROLES = ['ADMIN', 'LAWYER', 'ASSISTANT'];

export default function TeamSettingsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const canInvite =
    currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('LAWYER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    loadMembers();
  }, []);

  function openInviteForm() {
    setEmail('');
    setRole('LAWYER');
    setError('');
    setCreatedUser(null);
    setCopied(false);
    setShowInviteForm(true);
  }

  function closeModal() {
    setShowInviteForm(false);
    // Если приглашение было успешным — обновляем список после закрытия
    if (createdUser) {
      loadMembers();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      setError('Требуется авторизация');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const result = await usersApi.create({ email, role }, token);
      setCreatedUser(result as CreatedUserResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось пригласить сотрудника',
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
      // буфер обмена недоступен — пользователь скопирует вручную
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Настройки
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Команда</h1>
            <p className="text-muted-foreground">
              Сотрудники вашей организации
            </p>
          </div>
          {canInvite && (
            <Button onClick={openInviteForm}>Пригласить сотрудника</Button>
          )}
        </div>

        <Modal
          open={showInviteForm}
          onClose={closeModal}
          title={
            createdUser ? 'Сотрудник добавлен' : 'Пригласить сотрудника'
          }
        >
          {createdUser ? (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Аккаунт создан. Передайте эти данные сотруднику любым удобным
                способом — повторно пароль показан не будет.
              </p>

              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-mono text-sm">{createdUser.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Временный пароль
                  </div>
                  <div className="font-mono text-sm">
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
                  <span className="flex items-center justify-center gap-2">
                    <Check size={16} />
                    Скопировано
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Copy size={16} />
                    Скопировать
                  </span>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                Сотрудник сможет войти с этими данными или запросить смену
                пароля через «Забыли пароль?» на странице входа.
              </p>

              <Button type="button" onClick={closeModal} className="w-full">
                Готово
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <Button type="submit" loading={submitting} className="w-full">
                Создать аккаунт
              </Button>
            </form>
          )}
        </Modal>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Роль</th>
                <th className="p-4 text-left">В команде с</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    Загрузка...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    В организации пока нет сотрудников
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-4 font-medium">{member.email}</td>
                    <td className="p-4">
                      <span className="rounded-lg border border-border px-3 py-1 text-xs">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!canInvite && (
          <p className="text-sm text-muted-foreground">
            Приглашать новых сотрудников может только владелец или
            администратор организации.
          </p>
        )}
      </div>
    </AppShell>
  );
}
