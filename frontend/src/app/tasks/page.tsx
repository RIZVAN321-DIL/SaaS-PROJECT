// Файл 7: frontend/src/app/tasks/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { tasksApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { TaskForm } from '@/components/forms/task-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  caseId: string;

  case?: {
    id: string;
    title: string;
  };

  assignedTo?: {
    id: string;
    email: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'В работе',
  in_progress: 'Выполняется',
  completed: 'Завершено',
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  async function loadTasks() {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    try {
      const data = await tasksApi.getAll(token);
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

  async function completeTask(id: string) {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    await tasksApi.complete(id, token);
    await loadTasks();
  }

  async function removeTask(id: string) {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const confirmed = window.confirm('Удалить эту задачу?');
    if (!confirmed) return;

    await tasksApi.remove(id, token);
    await loadTasks();
  }

  const pendingTasks = tasks.filter((task) => task.status !== 'completed');
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Задачи
            </h1>

            <p className="text-muted-foreground">
              Управление задачами команды
            </p>
          </div>

          <Button
            onClick={() => {
              setTaskToEdit(null);
              setShowForm(true);
            }}
          >
            Новая задача
          </Button>
        </div>

        <Modal
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setTaskToEdit(null);
          }}
          title={taskToEdit ? 'Редактировать задачу' : 'Новая задача'}
        >
          <TaskForm
            taskToEdit={
              taskToEdit
                ? {
                    id: taskToEdit.id,
                    title: taskToEdit.title,
                    description: taskToEdit.description,
                    caseId: taskToEdit.caseId,
                    assignedToId: taskToEdit.assignedTo?.id,
                    dueDate: taskToEdit.dueDate,
                  }
                : undefined
            }
            onSuccess={() => {
              setShowForm(false);
              setTaskToEdit(null);
              loadTasks();
            }}
          />
        </Modal>

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
              {pendingTasks.length}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">
              Завершено
            </div>

            <div className="mt-2 text-4xl font-bold">
              {completedTasks.length}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">Задача</th>
                <th className="p-4 text-left">Дело</th>
                <th className="p-4 text-left">Исполнитель</th>
                <th className="p-4 text-left">Статус</th>
                <th className="p-4 text-left">Действия</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    Загрузка...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    Задач пока нет
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="font-medium">{task.title}</div>

                      {task.description && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {task.description}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {task.case ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/cases/${task.case!.id}`)}
                          className="text-primary hover:underline"
                        >
                          {task.case.title}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="p-4">{task.assignedTo?.email ?? '-'}</td>

                    <td className="p-4">
                      <span className="rounded-lg border border-border px-3 py-1 text-xs">
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {task.status !== 'completed' && (
                          <Button
                            variant="secondary"
                            onClick={() => completeTask(task.id)}
                            className="h-9 px-3 text-sm"
                          >
                            Завершить
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          onClick={() => {
                            setTaskToEdit(task);
                            setShowForm(true);
                          }}
                          className="h-9 px-3 text-sm"
                        >
                          Изменить
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => removeTask(task.id)}
                          className="h-9 px-3 text-sm"
                        >
                          Удалить
                        </Button>
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
