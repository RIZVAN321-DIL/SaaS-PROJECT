'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shield, Building2, Users, Briefcase, Zap, X, Trash2, CreditCard } from 'lucide-react';
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
  pricePerSeat: number;
  quantity: number;
}

interface OrganizationRow {
  id: string;
  name: string;
  createdAt: string;
  usersCount: number;
  casesCount: number;
  clientsCount: number;
  subscription?: OrgSubscription | null;
  monthlyTotal: number;
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Пробный период',
  active: 'Активна',
  past_due: 'Просрочена',
  canceled: 'Отменена',
  incomplete: 'Не завершена',
};

function formatRub(kopecks: number) {
  return `${(kopecks / 100).toLocaleString('ru-RU')} ₽`;
}

export default function AdminPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideTarget, setOverrideTarget] = useState<OrganizationRow | null>(null);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        if (me.isPlatformAdmin) await loadOrganizations();
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
    if (!confirm(`Отозвать бесплатный доступ у «${org.name}»?`)) return;
    try {
      await adminApi.revokeOverride(org.id, token);
      toast.success('Доступ отозван');
      loadOrganizations();
    } catch {
      toast.error('Не удалось отозвать доступ');
    }
  }

  async function handleDeleteOrganization(org: OrganizationRow) {
    const token = getAccessToken();
    if (!token) return;

    // Двойное подтверждение — необратимая операция
    if (
      !confirm(
        `Удалить организацию «${org.name}»?\n\nВместе с ней будут удалены все пользователи, дела, задачи, документы и подписка.\n\nЭто действие необратимо.`,
      )
    ) return;

    if (!confirm(`Вы уверены? Введите подтверждение — нажмите OK чтобы удалить «${org.name}» навсегда.`)) return;

    setDeletingId(org.id);
    try {
      await adminApi.deleteOrganization(org.id, token);
      toast.success(`Организация «${org.name}» удалена`);
      setOrganizations((prev) => prev.filter((o) => o.id !== org.id));
    } catch {
      toast.error('Не удалось удалить организацию');
    } finally {
      setDeletingId(null);
    }
  }

  if (checkingAccess) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Загрузка...
        </div>
      </AppShell>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <AppShell>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <Shield size={32} className="text-muted-foreground/40" />
          <p className="font-medium">Доступ запрещён</p>
          <p className="text-sm text-muted-foreground">
            Эта страница доступна только платформенным администраторам.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Все организации платформы</p>
        </div>

        <Modal
          open={Boolean(overrideTarget)}
          onClose={() => setOverrideTarget(null)}
          title={`Бесплатный доступ — ${overrideTarget?.name ?? ''}`}
        >
          <form onSubmit={handleGrant} className="space-y-4">
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
              Если не указать дату — доступ будет бессрочным до ручного отзыва.
            </p>
            <Button type="submit" loading={submitting} className="w-full">
              Предоставить доступ
            </Button>
          </form>
        </Modal>

        {!loading && (
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Building2 size={12} /> Организаций
              </div>
              <div className="mt-1 text-2xl font-bold">{organizations.length}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Users size={12} /> Пользователей
              </div>
              <div className="mt-1 text-2xl font-bold">
                {organizations.reduce((s, o) => s + o.usersCount, 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CreditCard size={12} /> Выручка / мес
              </div>
              <div className="mt-1 text-2xl font-bold">
                {formatRub(organizations.reduce((s, o) => s + o.monthlyTotal, 0))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Zap size={12} /> С ручным доступом
              </div>
              <div className="mt-1 text-2xl font-bold">
                {organizations.filter((o) => o.subscription?.manualOverride).length}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Организация
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Пользователи
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Дел / Клиентов
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Стоимость / мес
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Статус
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Building2 size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Организаций пока нет</p>
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="font-medium">{org.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(org.createdAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-sm">
                        <Users size={13} className="text-muted-foreground" /> {org.usersCount}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Briefcase size={13} className="text-muted-foreground" /> {org.casesCount}
                      </span>
                      <span className="text-xs text-muted-foreground">{org.clientsCount} клиентов</span>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="font-medium">{formatRub(org.monthlyTotal)}</div>
                      <div className="text-xs text-muted-foreground">
                        {org.usersCount} × {formatRub(org.subscription?.pricePerSeat ?? 99000)}
                      </div>
                    </td>
                    <td className="p-4">
                      {org.subscription?.manualOverride ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          <Zap size={10} /> Ручной доступ
                        </span>
                      ) : (
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px]">
                          {org.subscription
                            ? STATUS_LABELS[org.subscription.status] ?? org.subscription.status
                            : 'Нет подписки'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {org.subscription?.manualOverride ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(org)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
                          >
                            <X size={12} /> Отозвать
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openOverrideModal(org)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                          >
                            <Zap size={12} /> Дать доступ
                          </button>
                        )}

                        {/* ── Удаление организации ── */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrganization(org)}
                          disabled={deletingId === org.id}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10 disabled:opacity-40"
                          title="Удалить организацию и все её данные"
                        >
                          <Trash2 size={12} />
                          {deletingId === org.id ? '...' : 'Удалить'}
                        </button>
                      </div>
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
