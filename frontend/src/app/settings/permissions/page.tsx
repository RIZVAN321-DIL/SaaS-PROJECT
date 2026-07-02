'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock, Trash2, FileX } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { organizationsApi, OrganizationPermissions } from '@/lib/api';
import { getAccessToken, getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

const DEFAULT_PERMISSIONS: OrganizationPermissions = {
  lawyersSeeOnlyOwnCases: true,
  assistantsSeeOnlyOwnTasks: true,
  hideAdminSectionsFromLawyers: true,
  whoCanDeleteCases: 'ADMIN',
  whoCanDeleteDocuments: 'ADMIN',
};

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function PermissionsSettingsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const canEdit = currentUser?.role === 'OWNER';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<OrganizationPermissions>(DEFAULT_PERMISSIONS);

  async function load() {
    const token = getAccessToken();
    if (!token || !currentUser) return;
    setLoading(true);
    try {
      const data = await organizationsApi.getPermissions(currentUser.organizationId, token);
      setSettings(data);
    } catch {
      toast.error('Не удалось загрузить настройки прав доступа');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    const token = getAccessToken();
    if (!token || !currentUser) return;
    setSaving(true);
    try {
      // Отправляем только поля, которые ожидает UpdatePermissionsDto —
      // объект settings приходит из GET и содержит служебные поля
      // Prisma (id, organizationId, createdAt, updatedAt), которые
      // backend отклонит из-за forbidNonWhitelisted: true.
      const payload = {
        lawyersSeeOnlyOwnCases: settings.lawyersSeeOnlyOwnCases,
        assistantsSeeOnlyOwnTasks: settings.assistantsSeeOnlyOwnTasks,
        hideAdminSectionsFromLawyers: settings.hideAdminSectionsFromLawyers,
        whoCanDeleteCases: settings.whoCanDeleteCases,
        whoCanDeleteDocuments: settings.whoCanDeleteDocuments,
      };

      const updated = await organizationsApi.updatePermissions(
        currentUser.organizationId,
        payload,
        token,
      );
      setSettings(updated);
      toast.success('Настройки прав доступа сохранены');
    } catch {
      toast.error('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
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

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Lock size={20} /> Права доступа
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Владелец и администратор всегда видят и могут управлять всем в организации
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Видимость данных</h2>
              <div className="space-y-3">
                <ToggleRow
                  title="Юристы видят только свои дела"
                  description="Юрист видит дела, назначенные лично на него, и ещё не назначенные никому"
                  checked={settings.lawyersSeeOnlyOwnCases}
                  disabled={!canEdit}
                  onChange={(value) =>
                    setSettings((s) => ({ ...s, lawyersSeeOnlyOwnCases: value }))
                  }
                />
                <ToggleRow
                  title="Помощники видят только свои задачи"
                  description="Помощник видит задачи, назначенные лично на него, и ещё не назначенные никому"
                  checked={settings.assistantsSeeOnlyOwnTasks}
                  disabled={!canEdit}
                  onChange={(value) =>
                    setSettings((s) => ({ ...s, assistantsSeeOnlyOwnTasks: value }))
                  }
                />
                <ToggleRow
                  title="Скрыть админские разделы от юристов"
                  description="Скрывает «Журнал аудита», «Команду» и «Права доступа» в меню для роли Юрист"
                  checked={settings.hideAdminSectionsFromLawyers}
                  disabled={!canEdit}
                  onChange={(value) =>
                    setSettings((s) => ({ ...s, hideAdminSectionsFromLawyers: value }))
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Удаление</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Trash2 size={14} /> Кто может удалять дела
                  </p>
                  <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                    Владелец может удалять дела всегда
                  </p>
                  <select
                    value={settings.whoCanDeleteCases}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        whoCanDeleteCases: e.target.value as OrganizationPermissions['whoCanDeleteCases'],
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="OWNER">Только владелец</option>
                    <option value="ADMIN">Владелец и администратор</option>
                  </select>
                </div>

                <div className="rounded-xl border border-border/60 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <FileX size={14} /> Кто может удалять документы
                  </p>
                  <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                    Владелец может удалять документы всегда
                  </p>
                  <select
                    value={settings.whoCanDeleteDocuments}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        whoCanDeleteDocuments: e.target.value as OrganizationPermissions['whoCanDeleteDocuments'],
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="OWNER">Только владелец</option>
                    <option value="ADMIN">Владелец и администратор</option>
                    <option value="ALL">Все сотрудники</option>
                  </select>
                </div>
              </div>
            </div>

            {canEdit ? (
              <Button onClick={handleSave} loading={saving} className="w-full">
                Сохранить настройки
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Изменять права доступа может только владелец организации.
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
