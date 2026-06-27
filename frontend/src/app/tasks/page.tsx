'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ListChecks,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { tasksApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { TaskForm } from '@/components/forms/task-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  caseId: string;
  case?: { id: string; title: string };
  assignedTo?: { id: string; email: string };
}

type Filter = 'all' | 'pending' | 'overdue' | 'completed';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Все',
  pending: 'В работе',
  overdue: 'Просрочено',
  completed: 'Завершено',
};

function isOverdue(task: Task, now: Date | null) {
  if (!now) return false;
  return task.status !== 'completed' && !!task.dueDate && new Date(task.dueDate) < now;
}

function dueLabel(task: Task) {
  if (!task.dueDate) return null;
  return new Date(task.dueDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function loadTasks() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await tasksApi.getAll(token);
      setTasks(data as Task[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function completeTask(id: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      await tasksApi.complete(id, token);
      toast.success('Задача завершена');
      loadTasks();
    } catch {
      toast.error('Не удалось завершить задачу');
    }
  }

  async function removeTask(id: string) {
    const token = getAccessToken();
    if (!token) return;
    if (!confirm('Удалить эту задачу?')) return;
    try {
      await tasksApi.remove(id, token);
      toast.success('Задача удалена');
      loadTasks();
    } catch {
      toast.error('Не удалось удалить задачу');
    }
  }

  const now = mounted ? new Date() : null;

  const pending = tasks.filter((t) => t.status !== 'completed');
  const overdue = tasks.filter((t) => isOverdue(t, now));
  const completed = tasks.filter((t) => t.status === 'completed');

  const counts: Record<Filter, number> = {
    all: tasks.length,
    pending: pending.length,
    overdue: overdue.length,
    completed: completed.length,
  };

  const baseFiltered =
    filter === 'pending' ? pending
    : filter === 'overdue' ? overdue
    : filter === 'completed' ? completed
    : tasks;

  const filtered = baseFiltered.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.case?.title.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const aOver = isOverdue(a, now) ? -1 : 0;
    const bOver = isOverdue(b, now) ? -1 : 0;
    if (aOver !== bOver) return aOver - bOver;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Задачи</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Управление задачами команды</p>
          </div>
          <Button onClick={() => { setTaskToEdit(null); setShowForm(true); }} className="h-9 px-3 text-sm">
            <Plus size={14} /> Новая задача
          </Button>
        </div>

        <Modal
          open={showForm}
          onClose={() => { setShowForm(false); setTaskToEdit(null); }}
          title={taskToEdit ? 'Редактировать задачу' : 'Новая задача'}
        >
          <TaskForm
            taskToEdit={taskToEdit ? {
              id: taskToEdit.id,
              title: taskToEdit.title,
              description: taskToEdit.description,
              caseId: taskToEdit.caseId,
              assignedToId: taskToEdit.assignedTo?.id,
              dueDate: taskToEdit.dueDate,
            } : undefined}
            onSuccess={() => { setShowForm(false); setTaskToEdit(null); loadTasks(); }}
          />
        </Modal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Всего</div>
            <div className="mt-1 text-2xl font-bold">{tasks.length}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock size={11} /> В работе
            </div>
            <div className="mt-1 text-2xl font-bold">{pending.length}</div>
          </div>
          <div className={`rounded-2xl border p-4 ${overdue.length > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
            <div className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${overdue.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              <AlertTriangle size={11} /> Просрочено
            </div>
            <div className={`mt-1 text-2xl font-bold ${overdue.length > 0 ? 'text-red-500' : ''}`}>{overdue.length}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CheckCircle2 size={11} /> Завершено
            </div>
            <div className="mt-1 text-2xl font-bold">{completed.length}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {FILTER_LABELS[f]}
                {counts[f] > 0 && (
                  <span className={`ml-1.5 ${filter === f ? 'opacity-70' : 'text-muted-foreground'}`}>
                    {counts[f]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по задачам..."
              className="w-full rounded-xl border border-border bg-card py-2 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center">
              <ListChecks size={28} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Ничего не найдено' : 'Задач пока нет'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Задача</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Дело</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Исполнитель</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Срок</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((task) => {
                  const over = isOverdue(task, now);
                  const done = task.status === 'completed';
                  return (
                    <tr key={task.id} className="border-b border-border last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => !done && completeTask(task.id)}
                            className="shrink-0 accent-primary"
                          />
                          <div>
                            <span className={`text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
                              {task.title}
                            </span>
                            {task.description && (
                              <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {task.case ? (
                          <button type="button" onClick={() => router.push(`/cases/${task.case!.id}`)} className="text-xs text-primary hover:underline">
                            {task.case.title}
                          </button>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{task.assignedTo?.email ?? '—'}</td>
                      <td className="p-4">
                        {task.dueDate ? (
                          <span className={`text-xs font-medium ${over ? 'text-red-500' : done ? 'text-muted-foreground' : 'text-amber-500'}`}>
                            {over && <AlertTriangle size={10} className="mr-0.5 inline" />}
                            {dueLabel(task)}
                          </span>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          {!done && (
                            <button type="button" onClick={() => completeTask(task.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/10">
                              Завершить
                            </button>
                          )}
                          <button type="button" onClick={() => { setTaskToEdit(task); setShowForm(true); }} className="rounded-lg p-1.5 text-muted-foreground transition hover:text-foreground" aria-label="Изменить"><Pencil size={13} /></button>
                          <button type="button" onClick={() => removeTask(task.id)} className="rounded-lg p-1.5 text-muted-foreground transition hover:text-red-500" aria-label="Удалить"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && sorted.length > 0 && (
          <p className="text-right text-xs text-muted-foreground">{sorted.length} задач</p>
        )}
      </div>
    </AppShell>
  );
                    }
