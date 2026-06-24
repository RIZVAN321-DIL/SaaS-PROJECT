'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  ListChecks,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { dashboardApi } from '@/lib/api';
import { getAccessToken, getUser } from '@/lib/auth';

interface DashboardData {
  cases: {
    totalCases: number;
    byStage: {
      stageId: string;
      name: string;
      color?: string;
      count: number;
    }[];
  };
  clients: {
    totalClients: number;
    recentClients?: {
      id: string;
      fullName: string;
      createdAt: string;
    }[];
  };
  tasks: {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks?: number;
    byAssignee?: {
      userId: string;
      email: string;
      role: string;
      activeTasks: number;
      overdueTasks: number;
    }[];
    unassignedTasks?: number;
  };
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  danger,
  onClick,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ElementType;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-card p-5 transition ${onClick ? 'cursor-pointer hover:border-primary/50' : ''} ${danger ? 'border-red-500/30 bg-red-500/5' : 'border-border'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon size={16} className={danger ? 'text-red-500' : 'text-muted-foreground'} />
      </div>
      <div className={`mt-2 text-3xl font-bold ${danger ? 'text-red-500' : ''}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const token = getAccessToken();
      const user = getUser();
      if (!token || !user) return;
      const response = await dashboardApi.getDashboard(token);
      setData(response as DashboardData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  const user = getUser() as { email?: string } | null;
  const maxActiveTasks = Math.max(
    1,
    ...(data?.tasks.byAssignee?.map((a) => a.activeTasks) ?? [1]),
  );

  const completionRate = data
    ? Math.round((data.tasks.completedTasks / Math.max(1, data.tasks.totalTasks)) * 100)
    : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Рабочий стол</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {user?.email ? `Добро пожаловать, ${user.email}` : 'Обзор вашей юридической фирмы'}
            </p>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-accent"
          >
            <Clock size={12} /> Обновить
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Дел"
                value={data?.cases.totalCases ?? 0}
                sub={`по ${data?.cases.byStage.length ?? 0} стадиям`}
                icon={Briefcase}
                onClick={() => router.push('/cases')}
              />
              <StatCard
                label="Клиентов"
                value={data?.clients.totalClients ?? 0}
                sub="в базе"
                icon={Users}
                onClick={() => router.push('/clients')}
              />
              <StatCard
                label="Задач в работе"
                value={data?.tasks.pendingTasks ?? 0}
                sub={`из ${data?.tasks.totalTasks ?? 0} всего`}
                icon={ListChecks}
                onClick={() => router.push('/tasks')}
              />
              {(data?.tasks.overdueTasks ?? 0) > 0 ? (
                <StatCard
                  label="Просрочено"
                  value={data!.tasks.overdueTasks!}
                  sub="требуют внимания"
                  icon={AlertTriangle}
                  danger
                  onClick={() => router.push('/tasks')}
                />
              ) : (
                <StatCard
                  label="Выполнено"
                  value={data?.tasks.completedTasks ?? 0}
                  sub={`${completionRate}% задач завершено`}
                  icon={TrendingUp}
                />
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Briefcase size={15} /> Воронка дел
                  </h2>
                  <button type="button" onClick={() => router.push('/cases')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Все дела <ArrowRight size={11} />
                  </button>
                </div>
                {!data?.cases.byStage.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Дел пока нет</p>
                ) : (
                  <div className="space-y-2">
                    {data.cases.byStage.map((stage) => {
                      const pct = Math.round((stage.count / Math.max(1, data.cases.totalCases)) * 100);
                      return (
                        <div key={stage.stageId} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{stage.name}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-muted" style={{ height: 6 }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: stage.color ?? 'hsl(var(--primary))' }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-xs font-semibold">{stage.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Users size={15} /> Загрузка команды
                  </h2>
                  <button type="button" onClick={() => router.push('/tasks')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Все задачи <ArrowRight size={11} />
                  </button>
                </div>
                {!data?.tasks.byAssignee?.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Нет данных по сотрудникам</p>
                ) : (
                  <div className="space-y-4">
                    {data.tasks.byAssignee.map((person) => (
                      <div key={person.userId}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="max-w-[180px] truncate font-medium">{person.email}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {person.activeTasks} активных
                            {person.overdueTasks > 0 && (
                              <span className="ml-1 text-red-500">· {person.overdueTasks} просрочено</span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${person.overdueTasks > 0 ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${(person.activeTasks / maxActiveTasks) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {Boolean(data.tasks.unassignedTasks) && (
                      <p className="text-xs text-muted-foreground">Без исполнителя: {data.tasks.unassignedTasks}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {(data?.clients.recentClients?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Users size={15} /> Новые клиенты
                  </h2>
                  <button type="button" onClick={() => router.push('/clients')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Все клиенты <ArrowRight size={11} />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {data!.clients.recentClients!.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent/50"
                    >
                      <span className="font-medium">{client.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
                          }
