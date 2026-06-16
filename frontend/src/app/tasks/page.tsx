'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { tasksApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { TaskForm } from '@/components/forms/task-form';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  completedAt?: string;

  case?: {
    id: string;
    title: string;
  };

  assignedTo?: {
    id: string;
    email: string;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  async function loadTasks() {
    const token =
      getAccessToken();

    if (!token) {
      return;
    }

    try {
      const data =
        await tasksApi.getAll(
          token,
        );

      setTasks(data as Task[]);
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function completeTask(
    id: string,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      return;
    }

    await tasksApi.complete(
      id,
      token,
    );

    await loadTasks();
  }

  const pendingTasks =
    tasks.filter(
      (task) =>
        task.status ===
        'PENDING',
    );

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        'COMPLETED',
    );

  return (
    <AppShell>
      <div className="space-y-6">
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h1 className="text-3xl font-bold">
              Задачи
            </h1>

            <p className="text-muted-foreground">
              Управление задачами команды
            </p>
          </div>

          <button
            onClick={() =>
              setShowForm(true)
            }
            className="
              rounded-xl
              bg-primary
              px-5
              py-3
              text-sm
              font-medium
              text-primary-foreground
            "
          >
            Новая задача
          </button>
        </div>

        {showForm && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/50
            "
            onClick={() =>
              setShowForm(false)
            }
          >
            <div
              className="
                w-full
                max-w-lg
                rounded-2xl
                bg-background
                p-6
                shadow-xl
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <h2 className="mb-4 text-lg font-semibold">
                Новая задача
              </h2>

              <TaskForm
                onSuccess={() => {
                  setShowForm(false);
                  loadTasks();
                }}
              />
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">
              Всего задач
            </div>

            <div className="mt-2 text-4xl font-bold">
              {tasks.length}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">
              В работе
            </div>

            <div className="mt-2 text-4xl font-bold">
              {
                pendingTasks.length
              }
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">
              Завершено
            </div>

            <div className="mt-2 text-4xl font-bold">
              {
                completedTasks.length
              }
            </div>
          </div>
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
              <tr className="border-b border-border">
                <th className="p-4 text-left">
                  Задача
                </th>

                <th className="p-4 text-left">
                  Дело
                </th>

                <th className="p-4 text-left">
                  Исполнитель
                </th>

                <th className="p-4 text-left">
                  Статус
                </th>

                <th className="p-4 text-left">
                  Действие
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
              ) : tasks.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center"
                  >
                    Задач пока нет
                  </td>
                </tr>
              ) : (
                tasks.map(
                  (task) => (
                    <tr
                      key={task.id}
                      className="border-b border-border"
                    >
                      <td className="p-4">
                        <div className="font-medium">
                          {task.title}
                        </div>

                        {task.description && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {
                              task.description
                            }
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {task.case
                          ?.title ??
                          '-'}
                      </td>

                      <td className="p-4">
                        {task
                          .assignedTo
                          ?.email ??
                          '-'}
                      </td>

                      <td className="p-4">
                        <span
                          className="
                            rounded-lg
                            border
                            border-border
                            px-3
                            py-1
                            text-xs
                          "
                        >
                          {
                            task.status === 'PENDING'
                              ? 'В работе'
                              : task.status === 'COMPLETED'
                              ? 'Завершено'
                              : task.status
                          }
                        </span>
                      </td>

                      <td className="p-4">
                        {task.status !==
                          'COMPLETED' && (
                          <button
                            onClick={() =>
                              completeTask(
                                task.id,
                              )
                            }
                            className="
                              rounded-lg
                              border
                              border-border
                              px-3
                              py-2
                              text-sm
                            "
                          >
                            Завершить
                          </button>
                        )}
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
