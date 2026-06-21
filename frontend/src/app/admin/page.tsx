'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { adminApi, authApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface OrgSubscription {
  status: string;
  manualOverride: boolean;
  overrideReason?: string | null;
  overrideExpiresAt?: string | null;
  plan?: { name: string } | null;
}

interface OrganizationRow {
  id: string;
  name: string;
  createdAt: string;
  usersCount: number;
  casesCount: number;
  clientsCount: number;
  subscription?: OrgSubscription | null;
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Пробный период',
  active: 'Активна',
  past_due: 'Просрочена оплата',
  canceled: 'Отменена',
  incomplete: 'Не завершена',
};

export default function AdminPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideTarget, setOverrideTarget] = useState<OrganizationRow | null>(null);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadOrganizations() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await adminApi.getOrganizations(token);
      setOrganizations(data as OrganizationRow[]);
    } catch {
      toast.error('Не удалось загрузить организации');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkAccess() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const me = (await authApi.me(token)) as { isPlatformAdmin: boolean };
        setIsPlatformAdmin(me.isPlatformAdmin);
        if (me.isPlatformAdmin) {
          await loadOrganizations();
        }
      } catch {
        // silently fail
      } finally {
        setCheckingAccess(false);
      }
    }
    checkAccess();
  }, []);

  function openOverrideModal(org: OrganizationRow) {
    setOverrideTarget(org);
    setReason(org.subscription?.overrideReason ?? '');
    setExpiresAt(
      org.subscription?.overrideExpiresAt
        ? org.subscription.overrideExpiresAt.slice(0, 10)
        : '',
    );
  }

  async function handleGrant(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !overrideTarget) return;
    setSubmitting(true);
    try {
      await adminApi.grantOverride(
        overrideTarget.id,
        {
          reason: reason.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        },
        token,
      );
      toast.success('Бесплатный доступ предоставлен');
      setOverrideTarget(null);
      loadOrganizations();
    } catch {
      toast.error('Не удалось предоставить доступ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(org: OrganizationRow) {
    const token = getAccessToken();
    if (!token) return;
    const confirmed = window.confirm(`Отозвать бесплатный доступ у «${org.name}»?`);
    if (!confirmed) return;
    try {
      await adminApi.revokeOverride(org.id, token);
      toast.success('Доступ отозван');
      loadOrganizations();
    } catch {
      toast.error('Не удалось отозвать доступ');
    }
  }

  if (checkingAccess) {
    return (
      <AppShell>
        <div className="text-center text-muted-foreground">Загрузка...</div>
      </AppShell>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <AppShell>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium">Доступ запрещён</p>
          <p className="text-sm text-muted-foreground">
            Эта страница доступна только платформенным администраторам.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <p className="text-muted-foreground">Все организации платформы</p>
        </div>

        <Modal
          open={Boolean(overrideTarget)}
          onClose={() => setOverrideTarget(null)}
          title={`Бесплатный доступ — ${overrideTarget?.name ?? ''}`}
        >
          <form onSubmit={handleGrant} className="space-y-5">
            <Input
              label="Причина (необязательно)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: друг проекта"
            />
            <Input
              label="Действует до (необязательно)"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Если не указать дату — доступ будет бессрочным, пока вы не отзовёте его вручную.
            </p>
            <Button type="submit" loading={submitting} className="w-full">
              Предоставить доступ
            </Button>
          </form>
        </Modal>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">Организация</th>
                <th className="p-4 text-left">Пользователей</th>
                <th className="p-4 text-left">Дел / Клиентов</th>
                <th className="p-4 text-left">Статус</th>
                <th className="p-4 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">Загрузка...</td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">Организаций пока нет</td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(org.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td className="p-4">{org.usersCount}</td>
                    <td className="p-4">{org.casesCount} / {org.clientsCount}</td>
                    <td className="p-4">
                      {org.subscription?.manualOverride ? (
                        <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          Ручной доступ
                        </span>
                      ) : (
                        <span className="rounded-lg border border-border px-3 py-1 text-xs">
                          {org.subscription
                            ? STATUS_LABELS[org.subscription.status] ?? org.subscription.status
                            : 'Нет подписки'}
                        </span>
                      )}
                      {org.subscription?.plan && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {org.subscription.plan.name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {org.subscription?.manualOverride ? (
                        <Button
                          variant="danger"
                          onClick={() => handleRevoke(org)}
                          className="h-9 px-3 text-sm"
                        >
                          Отозвать доступ
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => openOverrideModal(org)}
                          className="h-9 px-3 text-sm"
                        >
                          Дать бесплатный доступ
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
  }
