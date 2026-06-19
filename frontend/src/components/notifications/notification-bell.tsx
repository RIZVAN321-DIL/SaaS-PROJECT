// Файл 3 (НОВЫЙ): frontend/src/components/notifications/notification-bell.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, Clock } from 'lucide-react';

import { notificationsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface NotificationTask {
  id: string;
  title: string;
  dueDate?: string;
  case?: {
    id: string;
    title: string;
  };
}

interface NotificationsResponse {
  overdueCount: number;
  upcomingCount: number;
  overdue: NotificationTask[];
  upcoming: NotificationTask[];
}

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const router = useRouter();

  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await notificationsApi.getAll(token);
      setData(response as NotificationsResponse);
    } catch {
      // тихо игнорируем — колокольчик не должен мешать работе
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Закрытие по клику снаружи
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function goToTask(task: NotificationTask) {
    if (task.case) {
      router.push(`/cases/${task.case.id}`);
    }
    setOpen(false);
  }

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) load();
      return next;
    });
  }

  const totalCount = (data?.overdueCount ?? 0) + (data?.upcomingCount ?? 0);
  const badgeLabel = totalCount > 9 ? '9+' : String(totalCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        title="Уведомления"
        aria-label="Уведомления"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border transition hover:bg-accent"
      >
        <Bell size={18} />

        {totalCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Уведомления</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Загрузка...
              </div>
            ) : totalCount === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Все задачи под контролем
              </div>
            ) : (
              <>
                {Boolean(data?.overdue.length) && (
                  <div>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-red-500">
                      <AlertTriangle size={12} />
                      Просрочено
                    </div>

                    {data!.overdue.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => goToTask(task)}
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition hover:bg-accent/50"
                      >
                        <span className="text-sm font-medium">{task.title}</span>

                        <span className="text-xs text-muted-foreground">
                          {task.case?.title ?? 'Без дела'}
                          {task.dueDate &&
                            ` · до ${new Date(task.dueDate).toLocaleDateString('ru-RU')}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {Boolean(data?.upcoming.length) && (
                  <div>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Clock size={12} />
                      Скоро (24 часа)
                    </div>

                    {data!.upcoming.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => goToTask(task)}
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition hover:bg-accent/50"
                      >
                        <span className="text-sm font-medium">{task.title}</span>

                        <span className="text-xs text-muted-foreground">
                          {task.case?.title ?? 'Без дела'}
                          {task.dueDate &&
                            ` · до ${new Date(task.dueDate).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              router.push('/tasks');
              setOpen(false);
            }}
            className="block w-full border-t border-border px-4 py-2.5 text-center text-sm text-primary hover:bg-accent/50"
          >
            Все задачи →
          </button>
        </div>
      )}
    </div>
  );
      }
