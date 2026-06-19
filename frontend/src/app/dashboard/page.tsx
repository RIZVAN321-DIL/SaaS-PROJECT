// Файл 10: frontend/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { dashboardApi } from '@/lib/api';
import {
  getAccessToken,
  getUser,
} from '@/lib/auth';

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

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadDashboard() {
    try {
      const token = getAccessToken();
      const user = getUser();

      if (!token || !user) return;

      const response =
        await dashboardApi.getDashboard(
          token,
        );

      setData(response as DashboardData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const maxActiveTasks = Math.max(
    1,
    ...(data?.tasks.byAssignee?.map((a) => a.activeTasks) ?? [1]),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Панель управления
          </h1>
          <p className="text-muted-foreground">
            Обзор вашей юридической фирмы
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-border"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground">
                  Дел
                </div>
                <div className="mt-2 text-4xl font-bold">
                  {data?.cases.totalCases ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground">
                  Клиентов
                </div>
                <div className="mt-2 text-4xl font-bold">
                  {data?.clients.totalClients ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground">
                  Задач
                </div>
                <div className="mt-2 text-4xl font-bold">
                  {data?.tasks.totalTasks ?? 0}
                </div>

                {typeof data?.tasks.overdueTasks === 'number' &&
                  data.tasks.overdueTasks > 0 && (
                    <div className="mt-1 text-xs text-red-500">
                      {data.tasks.overdueTasks} просрочено
                    </div>
                  )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Воронка дел
                </h2>
                <div className="space-y-3">
                  {data?.cases.byStage.map((stage) => (
                    <div
                      key={stage.stageId}
                      className="flex items-center justify-between rounded-xl border border-border p-4"
                    >
                      <span>{stage.name}</span>
                      <span className="font-semibold">
                        {stage.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Загрузка юристов
                </h2>

                {!data?.tasks.byAssignee || data.tasks.byAssignee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Нет данных по сотрудникам
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.tasks.byAssignee.map((person) => (
                      <div key={person.userId}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {person.email}
                          </span>

                          <span className="text-muted-foreground">
                            {person.activeTasks} активных
                            {person.overdueTasks > 0
                              ? ` · ${person.overdueTasks} просрочено`
                              : ''}
                          </span>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              person.overdueTasks > 0
                                ? 'bg-red-500'
                                : 'bg-primary'
                            }`}
                            style={{
                              width: `${
                                (person.activeTasks / maxActiveTasks) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {Boolean(data.tasks.unassignedTasks) && (
                      <p className="text-xs text-muted-foreground">
                        Без исполнителя: {data.tasks.unassignedTasks}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => router.push('/tasks')}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Все задачи →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
