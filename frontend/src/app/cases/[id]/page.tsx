'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Plus,
  ListChecks,
  FileText,
  CalendarDays,
  History,
  Pencil,
  Trash2,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  Upload,
  Clock,
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import {
  casesApi,
  tasksApi,
  documentsApi,
  documentTemplatesApi,
  calendarApi,
  auditApi,
  caseStagesApi,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { openBlobInNewTab, downloadBlobAsFile } from '@/lib/download';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CaseForm } from '@/components/forms/case-form';
import { TaskForm } from '@/components/forms/task-form';
import { DocumentUploadForm } from '@/components/forms/document-upload-form';
import { CalendarEventForm } from '@/components/forms/calendar-event-form';
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
  assignedLawyerId?: string;
  assignedLawyer?: { id: string; email: string };
  client?: { id: string; fullName: string; phone?: string; email?: string };
  caseType?: { id: string; name: string };
  stage?: Stage;
  tasks: TaskItem[];
  documents: DocumentItem[];
  deadlineLabel?: string | null;
  deadlineDate?: string | null;
  deadlineSourceDate?: string | null;
  deadlineDays?: number | null;
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

interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  caseId?: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

const ACTION_LABELS: Record<string, (log: AuditLog, stages: Stage[]) => string> = {
  CASE_CREATED: () => 'Дело создано',
  CASE_DELETED: () => 'Дело удалено',
  CASE_UPDATED: () => 'Дело отредактировано',
  CASE_MOVED_STAGE: (log, stages) => {
    const stageName = stages.find((s) => s.id === log.meta?.toStageId)?.name;
    return stageName ? `Стадия изменена на «${stageName}»` : 'Стадия изменена';
  },
  TASK_CREATED: (log) => `Создана задача «${log.meta?.title ?? ''}»`,
  TASK_COMPLETED: (log) => `Завершена задача «${log.meta?.title ?? ''}»`,
  DOCUMENT_UPLOADED: (log) => `Загружен документ «${log.meta?.name ?? ''}»`,
  DOCUMENT_DELETED: (log) => `Удалён документ «${log.meta?.name ?? ''}»`,
};

const ACTION_ICONS: Record<string, typeof Plus> = {
  CASE_CREATED: Plus,
  CASE_DELETED: Trash2,
  CASE_UPDATED: Pencil,
  CASE_MOVED_STAGE: GitBranch,
  TASK_CREATED: ListChecks,
  TASK_COMPLETED: CheckCircle2,
  DOCUMENT_UPLOADED: Upload,
  DOCUMENT_DELETED: Trash2,
};

const CARD_ITEM_LIMIT = 6;

// now передаётся снаружи — не вызываем new Date() внутри при рендере
function dueClass(dueDate?: string, status?: string, now?: Date): string {
  if (!dueDate || status === 'completed' || !now) return 'text-muted-foreground';
  const due = new Date(dueDate);
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  if (due < now) return 'text-red-500 font-semibold';
  if (due < soon) return 'text-amber-500 font-semibold';
  return 'text-muted-foreground';
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = getAccessToken();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX #425: new Date() только на клиенте после монтирования
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const [showEditCase, setShowEditCase] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);
  const [movingStage, setMovingStage] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineMode, setDeadlineMode] = useState<'fixed' | 'calc'>('fixed');
  const [deadlineLabelInput, setDeadlineLabelInput] = useState('');
  const [deadlineFixedInput, setDeadlineFixedInput] = useState('');
  const [deadlineSourceInput, setDeadlineSourceInput] = useState('');
  const [deadlineDaysInput, setDeadlineDaysInput] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const [caseRes, auditRes, stagesRes, eventsRes] = await Promise.all([
        casesApi.getById(id, token),
        auditApi.getAll(token),
        caseStagesApi.getAll(token),
        calendarApi.getAll(token),
      ]);

      const c = caseRes as CaseDetail;
      const allLogs = auditRes as AuditLog[];
      const allEvents = eventsRes as CalendarEventItem[];

      setCaseData(c);
      setAuditLogs(
        allLogs
          .filter((l) => l.entityId === id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
      setStages(stagesRes as Stage[]);
      setEvents(
        allEvents
          .filter((e) => e.caseId === id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      );
    } catch {
      toast.error('Не удалось загрузить дело');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDeleteCase() {
    if (!token || !caseData) return;
    if (!confirm(`Удалить дело «${caseData.title}»? Это действие необратимо.`)) return;
    try {
      await casesApi.remove(id, token);
      toast.success('Дело удалено');
      router.push('/cases');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить дело';
      toast.error(message);
    }
  }

  async function handleCompleteTask(taskId: string) {
    if (!token) return;
    try { await tasksApi.complete(taskId, token); toast.success('Задача завершена'); load(); }
    catch { toast.error('Не удалось завершить задачу'); }
  }

  async function handleDeleteTask(taskId: string) {
    if (!token) return;
    if (!confirm('Удалить эту задачу?')) return;
    try { await tasksApi.remove(taskId, token); toast.success('Задача удалена'); load(); }
    catch { toast.error('Не удалось удалить задачу'); }
  }

  async function handleOpenDoc(docId: string) {
    if (!token) return;
    setOpeningDoc(docId);
    try { const blob = await documentsApi.download(docId, token); openBlobInNewTab(blob); }
    catch { toast.error('Не удалось открыть документ'); }
    finally { setOpeningDoc(null); }
  }

  async function handleDeleteDoc(docId: string) {
    if (!token) return;
    setDeletingDoc(docId);
    try { await documentsApi.remove(docId, token); toast.success('Документ удалён'); load(); }
    catch { toast.error('Не удалось удалить документ'); }
    finally { setDeletingDoc(null); }
  }

  async function openGenerateModal() {
    setShowGenerateModal(true);
    if (!token || templates.length > 0) return;
    try {
      const data = (await documentTemplatesApi.getAll(token)) as { id: string; name: string }[];
      setTemplates(data);
    } catch {
      toast.error('Не удалось загрузить шаблоны');
    }
  }

  async function handleGenerateDocument(templateId: string, templateName: string) {
    if (!token) return;
    setGeneratingId(templateId);
    try {
      const blob = await documentTemplatesApi.generate(templateId, id, token);
      downloadBlobAsFile(blob, `${templateName}.docx`);
      toast.success('Документ сформирован и сохранён в деле');
      setShowGenerateModal(false);
      // Сгенерированный файл сервер уже сохранил в документах дела —
      // перезагружаем дело, чтобы он сразу появился в списке.
      load();
    } catch {
      toast.error('Не удалось сформировать документ');
    } finally {
      setGeneratingId(null);
    }
  }

  function openDeadlineModal() {
    if (!caseData) return;
    setDeadlineMode(caseData.deadlineSourceDate ? 'calc' : 'fixed');
    setDeadlineLabelInput(caseData.deadlineLabel ?? '');
    setDeadlineFixedInput(caseData.deadlineDate ? caseData.deadlineDate.slice(0, 10) : '');
    setDeadlineSourceInput(caseData.deadlineSourceDate ? caseData.deadlineSourceDate.slice(0, 10) : '');
    setDeadlineDaysInput(caseData.deadlineDays ? String(caseData.deadlineDays) : '');
    setShowDeadlineModal(true);
  }

  async function handleSaveDeadline(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingDeadline(true);
    try {
      const payload =
        deadlineMode === 'fixed'
          ? { label: deadlineLabelInput, fixedDate: deadlineFixedInput }
          : {
              label: deadlineLabelInput,
              sourceDate: deadlineSourceInput,
              days: Number(deadlineDaysInput),
            };
      await casesApi.setDeadline(id, payload, token);
      toast.success('Срок сохранён');
      setShowDeadlineModal(false);
      load();
    } catch {
      toast.error('Не удалось сохранить срок');
    } finally {
      setSavingDeadline(false);
    }
  }

  async function handleClearDeadline() {
    if (!token) return;
    setSavingDeadline(true);
    try {
      await casesApi.setDeadline(id, {}, token);
      toast.success('Срок снят');
      setShowDeadlineModal(false);
      load();
    } catch {
      toast.error('Не удалось снять срок');
    } finally {
      setSavingDeadline(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!token) return;
    if (!confirm('Удалить это событие?')) return;
    try { await calendarApi.remove(eventId, token); toast.success('Событие удалено'); load(); }
    catch { toast.error('Не удалось удалить событие'); }
  }

  async function handleMoveStage(stageId: string) {
    if (!token) return;
    setMovingStage(true);
    try { await casesApi.move(id, stageId, token); toast.success('Стадия обновлена'); load(); }
    catch { toast.error('Не удалось изменить стадию'); }
    finally { setMovingStage(false); }
  }

  if (loading) {
    return <AppShell><div className="flex h-64 items-center justify-center text-muted-foreground">Загрузка...</div></AppShell>;
  }

  if (!caseData) {
    return (
      <AppShell>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Дело не найдено</p>
          <Button variant="secondary" onClick={() => router.push('/cases')}>К списку дел</Button>
        </div>
      </AppShell>
    );
  }

  // FIX #425: now только на клиенте — на сервере loading=true и мы не доходим сюда,
  // но mounted даёт дополнительную защиту для dueClass и overdueTasks
  const now = mounted ? new Date() : null;

  const pendingTasks = caseData.tasks.filter((t) => t.status !== 'completed');
  const overdueTasks = now
    ? pendingTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now)
    : [];

  const sortedTasks = [...caseData.tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const nextTask = pendingTasks
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];

  const nextTaskOverdue = now && nextTask?.dueDate && new Date(nextTask.dueDate) < now;

  const rightPanel = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-4">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Клиент</h4>
        {caseData.client ? (
          <div className="space-y-1.5 text-sm">
            <Link href={`/clients/${caseData.client.id}`} className="block font-semibold hover:underline">{caseData.client.fullName}</Link>
            {caseData.client.phone && <a href={`tel:${caseData.client.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><Phone size={12} /> {caseData.client.phone}</a>}
            {caseData.client.email && <a href={`mailto:${caseData.client.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><Mail size={12} /> {caseData.client.email}</a>}
          </div>
        ) : <p className="text-sm text-muted-foreground">Клиент не указан</p>}
      </div>

      <div className="rounded-2xl border border-border p-4">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Дело</h4>
        <div className="space-y-1.5 text-sm">
          <p>Тип: <span className="font-medium text-primary">{caseData.caseType?.name ?? '—'}</span></p>
          <p className="text-muted-foreground">Стадия: {caseData.stage?.name ?? '—'}</p>
          <p className="text-muted-foreground">Ответственный юрист: {caseData.assignedLawyer?.email ?? 'не назначен'}</p>
          <p className="text-muted-foreground">Создано: {new Date(caseData.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>
      </div>

      {(() => {
        const deadlineDate = caseData.deadlineDate ? new Date(caseData.deadlineDate) : null;
        const daysLeft = deadlineDate
          ? Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : null;
        const urgent = daysLeft !== null && daysLeft <= 3;
        const soon = daysLeft !== null && daysLeft <= 7;
        return (
          <div
            className={`rounded-2xl border p-4 ${
              urgent
                ? 'border-red-300 bg-red-50'
                : soon
                ? 'border-amber-300 bg-amber-50'
                : 'border-border'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock size={12} /> Процессуальный срок
              </h4>
              <button type="button" onClick={openDeadlineModal} className="text-xs font-semibold text-primary hover:underline">
                {deadlineDate ? 'Изменить' : '+ Указать'}
              </button>
            </div>
            {deadlineDate ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{caseData.deadlineLabel || 'Срок по делу'}</p>
                <p className={urgent ? 'font-semibold text-red-600' : soon ? 'font-semibold text-amber-700' : 'text-muted-foreground'}>
                  {deadlineDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {daysLeft !== null && (
                    <span> {daysLeft >= 0 ? `(осталось ${daysLeft} дн.)` : `(просрочен на ${-daysLeft} дн.)`}</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Срок не указан</p>
            )}
          </div>
        );
      })()}

      <div className="rounded-2xl border border-border p-4">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Статистика</h4>
        <div className="space-y-1.5 text-sm">
          <p>Задач: <strong>{caseData.tasks.length}</strong>{overdueTasks.length > 0 && <span className="text-red-500"> (⚠ {overdueTasks.length})</span>}</p>
          <p>Документов: <strong>{caseData.documents.length}</strong></p>
          <p>Событий: <strong>{events.length}</strong></p>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell rightPanel={rightPanel}>
      <Modal open={showEditCase} onClose={() => setShowEditCase(false)} title="Редактировать дело">
        <CaseForm caseToEdit={{ id: caseData.id, title: caseData.title, description: caseData.description, clientId: caseData.clientId, caseTypeId: caseData.caseTypeId, assignedLawyerId: caseData.assignedLawyerId }} onSuccess={() => { setShowEditCase(false); toast.success('Дело обновлено'); load(); }} />
      </Modal>

      <Modal open={showAddTask} onClose={() => { setShowAddTask(false); setTaskToEdit(null); }} title={taskToEdit ? 'Редактировать задачу' : 'Новая задача'}>
        <TaskForm caseId={id} taskToEdit={taskToEdit ? { id: taskToEdit.id, title: taskToEdit.title, description: taskToEdit.description, caseId: id, assignedToId: taskToEdit.assignedTo?.id, dueDate: taskToEdit.dueDate } : undefined} onSuccess={() => { setShowAddTask(false); setTaskToEdit(null); toast.success(taskToEdit ? 'Задача обновлена' : 'Задача создана'); load(); }} />
      </Modal>

      <Modal open={showUploadDoc} onClose={() => setShowUploadDoc(false)} title="Загрузить документ">
        <DocumentUploadForm caseId={id} onSuccess={() => { setShowUploadDoc(false); toast.success('Документ загружен'); load(); }} />
      </Modal>

      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Сформировать документ по шаблону">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Нет ни одного шаблона. Создайте его в разделе{' '}
            <Link href="/settings/templates" className="text-primary hover:underline">Настройки → Шаблоны документов</Link>.
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={generatingId === t.id}
                onClick={() => handleGenerateDocument(t.id, t.name)}
                className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm transition hover:border-primary/50 disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><FileText size={14} /> {t.name}</span>
                <span className="text-xs text-muted-foreground">{generatingId === t.id ? 'Формируется…' : 'Скачать .docx'}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={showDeadlineModal} onClose={() => setShowDeadlineModal(false)} title="Процессуальный срок">
        <form onSubmit={handleSaveDeadline} className="space-y-4">
          <Input
            label="Название срока (необязательно)"
            placeholder="Например: Подача апелляции"
            value={deadlineLabelInput}
            onChange={(e) => setDeadlineLabelInput(e.target.value)}
          />

          <div className="flex gap-2 rounded-xl border border-border p-1">
            <button
              type="button"
              onClick={() => setDeadlineMode('fixed')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${deadlineMode === 'fixed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Фиксированная дата
            </button>
            <button
              type="button"
              onClick={() => setDeadlineMode('calc')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${deadlineMode === 'calc' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              От даты события + дни
            </button>
          </div>

          {deadlineMode === 'fixed' ? (
            <Input
              label="Дата дедлайна"
              type="date"
              value={deadlineFixedInput}
              onChange={(e) => setDeadlineFixedInput(e.target.value)}
              required
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Дата события"
                type="date"
                value={deadlineSourceInput}
                onChange={(e) => setDeadlineSourceInput(e.target.value)}
                required
              />
              <Input
                label="Дней на срок"
                type="number"
                min={0}
                placeholder="30"
                value={deadlineDaysInput}
                onChange={(e) => setDeadlineDaysInput(e.target.value)}
                required
              />
            </div>
          )}

          {deadlineMode === 'calc' && deadlineSourceInput && deadlineDaysInput && (
            <p className="text-xs text-muted-foreground">
              Итоговый срок:{' '}
              <span className="font-medium text-foreground">
                {new Date(
                  new Date(deadlineSourceInput).getTime() +
                    Number(deadlineDaysInput) * 24 * 60 * 60 * 1000,
                ).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {caseData.deadlineDate && (
              <Button type="button" variant="secondary" onClick={handleClearDeadline} loading={savingDeadline}>
                Снять срок
              </Button>
            )}
            <Button type="submit" loading={savingDeadline} className="flex-1">
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showAddEvent} onClose={() => setShowAddEvent(false)} title="Новое событие">
        <CalendarEventForm caseId={id} onSuccess={() => { setShowAddEvent(false); toast.success('Событие создано'); load(); }} />
      </Modal>

      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/cases" className="hover:underline">Дела</Link>
          <span>›</span>
          <span className="truncate font-medium text-foreground">{caseData.title}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h1 className="text-2xl font-bold break-words">{caseData.title}</h1>
            {caseData.stage && <span className="rounded-full px-3 py-1 text-xs font-semibold text-white shrink-0" style={{ backgroundColor: caseData.stage.color ?? '#6366f1' }}>● {caseData.stage.name}</span>}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={() => setShowEditCase(true)}><Pencil size={14} /> Редактировать</Button>
            <Button variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={handleDeleteCase}><Trash2 size={14} /> Удалить</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          {caseData.caseType && <span className="flex items-center gap-1.5"><Briefcase size={14} /> {caseData.caseType.name}</span>}
          {caseData.client && <span className="flex items-center gap-1.5"><User size={14} /> {caseData.client.fullName}</span>}
          {caseData.client?.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {caseData.client.phone}</span>}
          {overdueTasks.length > 0 && <span className="flex items-center gap-1.5 font-semibold text-red-500"><AlertTriangle size={14} /> {overdueTasks.length} {overdueTasks.length === 1 ? 'просрочка' : 'просрочки'}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setTaskToEdit(null); setShowAddTask(true); }} className="h-9 px-3 text-sm"><Plus size={14} /> Задача</Button>
          <Button onClick={() => setShowUploadDoc(true)} className="h-9 px-3 text-sm"><Plus size={14} /> Документ</Button>
          <Button onClick={() => setShowAddEvent(true)} className="h-9 px-3 text-sm"><Plus size={14} /> Событие</Button>
        </div>

        {stages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 text-xs text-muted-foreground">Стадия:</span>
            {stages.map((s) => (
              <button key={s.id} disabled={movingStage || caseData.stage?.id === s.id} onClick={() => handleMoveStage(s.id)} className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-40" style={{ backgroundColor: s.color ?? '#6366f1' }}>{s.name}</button>
            ))}
          </div>
        )}

        {nextTask && (
          <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${nextTaskOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="min-w-0">
              <div className={`text-[11px] font-semibold uppercase tracking-wide ${nextTaskOverdue ? 'text-red-500' : 'text-amber-500'}`}>{nextTaskOverdue ? 'Просрочено' : 'Следующее действие'}</div>
              <div className="mt-0.5 truncate text-sm font-semibold">{nextTask.title} — до {new Date(nextTask.dueDate!).toLocaleDateString('ru-RU')}</div>
            </div>
            <Button onClick={() => handleCompleteTask(nextTask.id)} className={`h-9 shrink-0 px-3 text-sm ${nextTaskOverdue ? 'bg-red-500 hover:bg-red-600' : ''}`}>Выполнить <ArrowRight size={14} /></Button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><ListChecks size={15} /> Задачи <span className="text-xs font-normal text-muted-foreground">{caseData.tasks.length}</span></h3>
              <button type="button" onClick={() => { setTaskToEdit(null); setShowAddTask(true); }} className="text-xs font-semibold text-primary hover:underline">+ Добавить</button>
            </div>
            {sortedTasks.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Нет задач</p> : (
              <div className="space-y-0.5">
                {sortedTasks.slice(0, CARD_ITEM_LIMIT).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 border-b border-border/60 py-2 text-sm last:border-0">
                    <input type="checkbox" checked={task.status === 'completed'} onChange={() => task.status !== 'completed' && handleCompleteTask(task.id)} className="shrink-0 accent-primary" />
                    <span className={`min-w-0 flex-1 truncate ${task.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</span>
                    {task.dueDate && <span className={`shrink-0 text-[11px] ${dueClass(task.dueDate, task.status, now ?? undefined)}`}>{new Date(task.dueDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>}
                    <button type="button" onClick={() => { setTaskToEdit(task); setShowAddTask(true); }} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Изменить"><Pencil size={12} /></button>
                    <button type="button" onClick={() => handleDeleteTask(task.id)} className="shrink-0 text-muted-foreground hover:text-red-500" aria-label="Удалить"><Trash2 size={12} /></button>
                  </div>
                ))}
                {sortedTasks.length > CARD_ITEM_LIMIT && <p className="pt-2 text-center text-xs text-muted-foreground">и ещё {sortedTasks.length - CARD_ITEM_LIMIT}</p>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><FileText size={15} /> Документы <span className="text-xs font-normal text-muted-foreground">{caseData.documents.length}</span></h3>
              <div className="flex items-center gap-3">
                <button type="button" onClick={openGenerateModal} className="text-xs font-semibold text-primary hover:underline">Сформировать по шаблону</button>
                <button type="button" onClick={() => setShowUploadDoc(true)} className="text-xs font-semibold text-primary hover:underline">+ Добавить</button>
              </div>
            </div>
            {caseData.documents.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Нет документов</p> : (
              <div className="space-y-0.5">
                {caseData.documents.slice(0, CARD_ITEM_LIMIT).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 border-b border-border/60 py-2 text-sm last:border-0">
                    <FileText size={13} className="shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                    <button type="button" onClick={() => handleOpenDoc(doc.id)} disabled={openingDoc === doc.id} className="shrink-0 text-xs text-primary hover:underline disabled:opacity-50">{openingDoc === doc.id ? '...' : 'Открыть'}</button>
                    <button type="button" onClick={() => handleDeleteDoc(doc.id)} disabled={deletingDoc === doc.id} className="shrink-0 text-muted-foreground hover:text-red-500" aria-label="Удалить"><Trash2 size={12} /></button>
                  </div>
                ))}
                {caseData.documents.length > CARD_ITEM_LIMIT && <p className="pt-2 text-center text-xs text-muted-foreground">и ещё {caseData.documents.length - CARD_ITEM_LIMIT}</p>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays size={15} /> Календарь <span className="text-xs font-normal text-muted-foreground">{events.length}</span></h3>
              <button type="button" onClick={() => setShowAddEvent(true)} className="text-xs font-semibold text-primary hover:underline">+ Добавить</button>
            </div>
            {events.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Нет событий</p> : (
              <div className="space-y-0.5">
                {events.slice(0, CARD_ITEM_LIMIT).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 border-b border-border/60 py-2 text-sm last:border-0">
                    <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">{new Date(event.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
                    <span className="min-w-0 flex-1 truncate">{event.title}</span>
                    <button type="button" onClick={() => handleDeleteEvent(event.id)} className="shrink-0 text-muted-foreground hover:text-red-500" aria-label="Удалить"><Trash2 size={12} /></button>
                  </div>
                ))}
                {events.length > CARD_ITEM_LIMIT && <p className="pt-2 text-center text-xs text-muted-foreunder">и ещё {events.length - CARD_ITEM_LIMIT}</p>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><History size={15} /> История</h3>
            {auditLogs.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Событий пока нет</p> : (
              <div className="space-y-0.5">
                {auditLogs.slice(0, 8).map((log) => {
                  const Icon = ACTION_ICONS[log.action] ?? Pencil;
                  const label = ACTION_LABELS[log.action]?.(log, stages) ?? log.action;
                  return (
                    <div key={log.id} className="flex items-start gap-2 border-b border-border/60 py-2 text-sm last:border-0">
                      <Icon size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
  }
