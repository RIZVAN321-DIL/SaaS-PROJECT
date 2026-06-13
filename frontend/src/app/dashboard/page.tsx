'use client';

import { useEffect, useState } from 'react';

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
  };

  tasks: {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
  };
}

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token =
          getAccessToken();

        const user =
          getUser();

        if (
          !token ||
          !user
        ) {
          return;
        }

        const response =
          await dashboardApi.getDashboard(
            user.organizationId,
            token,
          );

        setData(
          response as DashboardData,
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="text-muted-foreground">
            Overview of your law firm
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-36
                    animate-pulse
                    rounded-2xl
                    border
                    border-border
                  "
                />
              ),
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground">
                  Cases
                </div>

                <div className="mt-2 text-4xl font-bold">
                  {data?.cases
                    .totalCases ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground">
                  Clients
                </div>

                <div className="mt-2 text-4xl font-bold">
                  {data?.clients
                    .totalClients ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground">
                  Tasks
                </div>

                <div className="mt-2 text-4xl font-bold">
                  {data?.tasks
                    .totalTasks ?? 0}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">
                Pipeline
              </h2>

              <div className="space-y-3">
                {data?.cases.byStage.map(
                  (stage) => (
                    <div
                      key={stage.stageId}
                      className="
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-border
                        p-4
                      "
                    >
                      <span>
                        {stage.name}
                      </span>

                      <span className="font-semibold">
                        {stage.count}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
