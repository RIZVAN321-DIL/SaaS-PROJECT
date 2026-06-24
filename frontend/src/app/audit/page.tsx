'use client';

import { useEffect, useState } from 'react';
import {
  History,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  ListChecks,
  CheckCircle2,
  Upload,
  Search,
  User,
} from 'lucide-react';

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

const ACTION_LABELS: Record<string, (log: AuditLog) => string> = {
  CASE_CREATED: () => 'Дело создано',
  CASE_DELETED: () => 'Дело удалено',
  CASE_UPDATED: () => 'Дело отредактировано',
  CASE_MOVED_STAGE: () => 'Стадия дела изменена',
  TASK_CREATED: (log) => `Задача создана${log.meta?.title ? `: «${log.meta.title}»` : ''}`,
  TASK_COMPLETED: (log) => `Задача завершена${log.meta?.title ? `: «${log.meta.title}»` : ''}`,
  DOCUMENT_UPLOADED: (log) => `Документ загружен${log.meta?.name ? `: «${log.meta.name}»` : ''}`,
  DOCUMENT_DELETED: (log) => `Документ удалён${log.meta?.name ? `: «${log.meta.name}»` : ''}`,
  CLIENT_CREATED: () => 'Клиент добавлен',
  CLIENT_UPDATED: () => 'Данные клиента изменены',
  CLIENT_DELETED: () => 'Клиент удалён',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  CASE_CREATED: Plus,
  CASE_DELETED: Trash2,
  CASE_UPDATED: Pencil,
  CASE_MOVED_STAGE: GitBranch,
  TASK_CREATED: ListChecks,
  TASK_COMPLETED: CheckCircle2,
  DOCUMENT_UPLOADED: Upload,
  DOCUMENT_DELETED: Trash2,
  CLIENT_CREATED: User,
  CLIENT_UPDATED: Pencil,
  CLIENT_DELETED: Trash2,
};

const ENTITY_LABELS: Record<string, string> = {
  Case: 'Дело',
  Task: 'Задача',
  Document: 'Документ',
  Client: 'Клиент',
  User: 'Пользователь',
};

const ACTION_COLORS: Record<string, string> = {
  CASE_CREATED: 'text-emerald-500',
  TASK_COMPLETED: 'text-emerald-500',
  CASE_DELETED: 'text-red-500',
  DOCUMENT_DELETED: 'text-red-500',
  CLIENT_DELETED: 'text-red-500',
  TASK_CREATED: 'text-primary',
  DOCUMENT_UPLOADED: 'text-primary',
  CASE_UPDATED: 'text-amber-500',
  CASE_MOVED_STAGE: 'text-amber-500',
};

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  async function loadLogs() {
    try {
      const token = getAccessToken();
      if (!token) return;
      const data = await auditApi.getAll(token);
      setLogs(
        (data as AuditLog[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLogs(); }, []);

  const entities = [...new Set(logs.map((l) => l.entity))];

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      (ACTION_LABELS[log.action]?.(log) ?? log.action).toLowerCase().includes(search.toLowerCase()) ||
      log.userId.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());
    const matchEntity = !entityFilter || log.entity === entityFilter;
    return matchSearch && matchEntity;
  });

  const grouped = filtered.reduce<Record<string, AuditLog[]>>((acc, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('ru-RU', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Журнал аудита</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Полная история действий в системе</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по действию, пользователю..."
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          {entities.length > 0 && (
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Все объекты</option>
              {entities.map((e) => (
                <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>
              ))}
            </select>
          )}
        </div>

        {!loading && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><History size={12} /> {logs.length} записей</span>
            {filtered.length !== logs.length && <span>· показано {filtered.length}</span>}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <History size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search || entityFilter ? 'Ничего не найдено' : 'Записей аудита пока нет'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dateLogs]) => (
              <div key={date}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">{date}</span>
                  <div className="flex-1 border-t border-border" />
                  <span className="text-[11px] text-muted-foreground">{dateLogs.length}</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border/60">
                  {dateLogs.map((log) => {
                    const Icon = ACTION_ICONS[log.action] ?? Pencil;
                    const label = ACTION_LABELS[log.action]?.(log) ?? log.action;
                    const color = ACTION_COLORS[log.action] ?? 'text-muted-foreground';
                    const time = new Date(log.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ${color}`}>
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{label}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              <span className="font-mono">{shortId(log.userId)}</span>
                            </span>
                            <span>{ENTITY_LABELS[log.entity] ?? log.entity} · <span className="font-mono">{shortId(log.entityId)}</span></span>
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
