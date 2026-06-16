'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { auditApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export default function AuditPage() {
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function loadLogs() {
    try {
      const token =
        getAccessToken();

      if (!token) {
        return;
      }

      const data =
        await auditApi.getAll(
          token,
        );

      setLogs(
        data as AuditLog[],
      );
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Журнал аудита
          </h1>

          <p className="text-muted-foreground">
            Полная история действий в системе
          </p>
        </div>

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-border
            bg-card
          "
        >
          <table className="w-full">
            <thead>
              <tr
                className="
                  border-b
                  border-border
                "
              >
                <th className="p-4 text-left">
                  Действие
                </th>

                <th className="p-4 text-left">
                  Объект
                </th>

                <th className="p-4 text-left">
                  ID объекта
                </th>

                <th className="p-4 text-left">
                  Пользователь
                </th>

                <th className="p-4 text-left">
                  Дата
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center"
                  >
                    Загрузка...
                  </td>
                </tr>
              ) : logs.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center"
                  >
                    Записей аудита пока нет
                  </td>
                </tr>
              ) : (
                logs.map(
                  (log) => (
                    <tr
                      key={log.id}
                      className="
                        border-b
                        border-border
                      "
                    >
                      <td className="p-4">
                        <span
                          className="
                            rounded-lg
                            border
                            border-border
                            px-3
                            py-1
                            text-xs
                            font-medium
                          "
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="p-4">
                        {log.entity}
                      </td>

                      <td className="p-4 font-mono text-sm">
                        {log.entityId}
                      </td>

                      <td className="p-4 font-mono text-sm">
                        {log.userId}
                      </td>

                      <td className="p-4">
                        {new Date(
                          log.createdAt,
                        ).toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
