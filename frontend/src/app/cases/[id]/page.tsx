'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { AppShell } from '@/components/layout/app-shell';
import { casesApi, tasksApi, documentsApi, auditApi, caseStagesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CaseForm } from '@/components/forms/case-form';
import { TaskForm } from '@/components/forms/task-form';
import { DocumentUploadForm } from '@/components/forms/document-upload-form';
import { toast } from '@/lib/toast';

// ─── Типы ────────────────────────────────────────────────────────────────────

interface Stage {
  id: string;
  name: string;
  color?: string;
}

interface CaseDetail {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  clientId: string;
  caseTypeId?: string;
  client?: { id: string; fullName: string; phone?: string; email?: string };
  caseType?: { id: string; name: string };
  stage?: Stage;
  tasks: TaskItem[];
  documents: DocumentItem[];
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  assignedTo?: { id: string; email: string };
}

interface DocumentItem {
  id: string;
  name: string;
  type?: string;
  fileUrl?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  createdAt: string;
}

// ─── Вкладки ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'documents' | 'tasks' | 'history';

const tabs: { key: Tab; label: string }[] = [
  { key: 'overview',   label: 'Обзор'      },
  { key: 'tasks',      label: 'Задачи'     },
  { key: 'documents',  label: 'Документы'  },
  { key: 'history',    label: 'История'    },
];

// ─── Компонент ───────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = getAccessToken();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [showEditCase, setShowEditCase] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [movingStage, setMovingStage] = useState(false);

  // ── Загрузка данных ─────────────────────────────────────────────────────

  async function load() {
    if (!token) return;
    try {
      const [caseRes, auditRes, stagesRes] = await Promise.all([
        casesApi.getById(id, token),
        auditApi.getAll(token),
        caseStagesApi.getAll(token),
      ]);
      const c = caseRes as CaseDetail;
      const allLogs = auditRes as AuditLog[];
      setCaseData(c);
      setAuditLogs(allLogs.filter((l) => l.entityId === id));
      setStages(stagesRes as Stage[]);
    } catch {
      toast.error('Не удалось загрузить дело');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  // ── Действия ────────────────────────────────────────────────────────────

  async function handleDeleteCase() {
    if (!token || !caseData) return;
    if (!confirm(`Удалить дело «${caseData.title}»? Это действие необратимо.`)) return;
    try {
      await casesApi.remove(id, token);
      toast.success('Дело удалено');
      router.push('/cases');
    } catch {
      toast.error('Не удалось удалить дело');
    }
  }

  async function handleCompleteTask(taskId: string) {
    if (!token) return;
    try {
      await tasksApi.complete(taskId, token);
      toast.success('Задача завершена');
      load();
    } catch {
      toast.error('Не удалось завершить задачу');
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!token) return;
    if (!confirm('Удалить эту задачу?')) return;
    try {
      await tasksApi.remove(taskId, token);
      toast.success('Задача удалена');
      load();
    } catch {
      toast.error('Не удалось удалить задачу');
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!token) return;
    setDeletingDoc(docId);
    try {
      await documentsApi.remove(docId, token);
      toast.success('Документ удалён');
      load();
    } catch {
      toast.error('Не удалось удалить документ');
    } finally {
      setDeletingDoc(null);
    }
  }

  async function handleMoveStage(stageId: string) {
    if (!token) return;
    setMovingStage(true);
    try {
      await casesApi.move(id, stageId, token);
      toast.success('Стадия обновлена');
      load();
    } catch {
      toast.error('Не удалось изменить стадию');
    } finally {
      setMovingStage(false);
    }
  }

  // ── Рендер ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Загрузка...
        </div>
      </AppShell>
    );
  }

  if (!caseData) {
    return (
      <AppShell>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Дело не найдено</p>
          <Button variant="secondary" onClick={() => router.push('/cases')}>
            К списку дел
          </Button>
        </div>
      </AppShell>
    );
  }

  const pendingTasks = caseData.tasks.filter((t) => t.status !== 'completed');

  return (
    <AppShell>
      {/* Модалки */}
      <Modal open={showEditCase} onClose={() => setShowEditCase(false)} title="Редактировать дело">
        <CaseForm
          caseToEdit={{
            id: caseData.id,
            title: caseData.title,
            description: caseData.description,
            clientId: caseData.clientId,
            caseTypeId: caseData.caseTypeId,
          }}
          onSuccess={() => { setShowEditCase(false); load(); }}
        />
      </Modal>

      <Modal
        open={showAddTask}
        onClose={() => { setShowAddTask(false); setTaskToEdit(null); }}
        title={taskToEdit ? 'Редактировать задачу' : 'Новая задача'}
      >
        <TaskForm
          caseId={id}
          taskToEdit={
            taskToEdit
              ? {
                  id: taskToEdit.id,
                  title: taskToEdit.title,
                  description: taskToEdit.description,
                  caseId: id,
                  assignedToId: taskToEdit.assignedTo?.id,
                  dueDate: taskToEdit.dueDate,
                }
              : undefined
          }
          onSuccess={() => { setShowAddTask(false); setTaskToEdit(null); load(); }}
        />
      </Modal>

      <Modal open={showUploadDoc} onClose={() => setShowUploadDoc(false)} title="Загрузить документ">
        <DocumentUploadForm
          caseId={id}
          onSuccess={() => { setShowUploadDoc(false); load(); }}
        />
      </Modal>

      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/cases" className="hover:underline">Дела</Link>
          <span>›</span>
          <span className="truncate font-medium text-foreground">{caseData.title}</span>
        </div>

        {/* Шапка */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold break-words">{caseData.title}</h1>
              {caseData.stage && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium text-white shrink-0"
                  style={{ backgroundColor: caseData.stage.color ?? '#6366f1' }}
                >
                  {caseData.stage.name}
                </span>
              )}
            </div>
            {caseData.description && (
              <p className="mt-2 text-muted-foreground">{caseData.description}</p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setShowEditCase(true)}>
              Редактировать
            </Button>
            <Button variant="danger" onClick={handleDeleteCase}>
              Удалить
            </Button>
          </div>
        </div>

        {/* Смена стадии */}
        {stages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 text-sm text-muted-foreground">Стадия:</span>
            {stages.map((s) => (
              <button
                key={s.id}
                disabled={movingStage || caseData.stage?.id === s.id}
                onClick={() => handleMoveStage(s.id)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: s.color ?? '#6366f1' }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Вкладки */}
        <div className="border-b border-border">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {tab.key === 'tasks' && pendingTasks.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {pendingTasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Обзор ──────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Клиент */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Клиент
              </h2>
              {caseData.client ? (
                <div className="space-y-2">
                  <Link
                    href={`/clients/${caseData.client.id}`}
                    className="block text-lg font-semibold hover:underline"
                  >
                    {caseData.client.fullName}
                  </Link>
                  {caseData.client.phone && (
                    <a href={`tel:${caseData.client.phone}`} className="block text-sm text-muted-foreground hover:underline">
                      {caseData.client.phone}
                    </a>
                  )}
                  {caseData.client.email && (
                    <a href={`mailto:${caseData.client.email}`} className="block text-sm text-muted-foreground hover:underline">
                      {caseData.client.email}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Клиент не указан</p>
              )}
            </div>

            {/* Детали дела */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Детали
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Тип дела</dt>
                  <dd className="font-medium">{caseData.caseType?.name ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Текущая стадия</dt>
                  <dd className="font-medium">{caseData.stage?.name ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Создано</dt>
                  <dd className="font-medium">
                    {new Date(caseData.createdAt).toLocaleDateString('ru-RU')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Задач в работе</dt>
                  <dd className="font-medium">{pendingTasks.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Документов</dt>
                  <dd className="font-medium">{caseData.documents.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* ── Задачи ─────────────────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setTaskToEdit(null); setShowAddTask(true); }}>
                Добавить задачу
              </Button>
            </div>

            {caseData.tasks.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                Задач пока нет
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-left">Задача</th>
                      <th className="p-4 text-left">Исполнитель</th>
                      <th className="p-4 text-left">Срок</th>
                      <th className="p-4 text-left">Статус</th>
                      <th className="p-4 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.tasks.map((task) => (
                      <tr key={task.id} className="border-b border-border last:border-0">
                        <td className="p-4">
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="mt-1 text-sm text-muted-foreground">{task.description}</div>
                          )}
                        </td>
                        <td className="p-4 text-sm">{task.assignedTo?.email ?? '—'}</td>
                        <td className="p-4 text-sm">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('ru-RU')
                            : '—'}
                        </td>
                        <td className="p-4">
                          <span className="rounded-lg border border-border px-2 py-1 text-xs">
                            {task.status === 'completed' ? 'Завершено' : 'В работе'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {task.status !== 'completed' && (
                              <Button
                                variant="secondary"
                                onClick={() => handleCompleteTask(task.id)}
                                className="h-8 px-3 text-xs"
                              >
                                Завершить
                              </Button>
                            )}

                            <Button
                              variant="secondary"
                              onClick={() => { setTaskToEdit(task); setShowAddTask(true); }}
                              className="h-8 px-3 text-xs"
                            >
                              Изменить
                            </Button>

                            <Button
                              variant="danger"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-8 px-3 text-xs"
                            >
                              Удалить
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Документы ──────────────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowUploadDoc(true)}>Загрузить документ</Button>
            </div>

            {caseData.documents.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                Документов пока нет
              </div>
            ) : (
              <div className="grid gap-3">
                {caseData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                  >
                    <div>
                      <div className="font-medium">{doc.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.type && (
                        <span className="rounded-lg border border-border px-2 py-1 text-xs">
                          {doc.type}
                        </span>
                      )}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
                        >
                          Открыть
                        </a>
                      )}
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="h-8 px-3 text-xs"
                      >
                        {deletingDoc === doc.id ? '...' : 'Удалить'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── История ────────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            {auditLogs.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                Событий пока нет
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium">
                          {log.action}
                        </span>
                        <span className="text-sm">{log.entity}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
          }
