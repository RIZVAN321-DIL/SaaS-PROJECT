'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus, AlertTriangle, Search } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { CaseForm } from '@/components/forms/case-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface TaskShort {
  id: string;
  status: string;
  dueDate?: string;
}

interface CaseItem {
  id: string;
  title: string;
  description?: string;
  client?: { id: string; fullName: string };
  caseType?: { id: string; name: string };
  stage?: { id: string; name: string; color?: string };
  tasks?: TaskShort[];
  createdAt: string;
}

function pluralDela(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 19) return 'дел';
  if (mod10 === 1) return 'дело';
  if (mod10 >= 2 && mod10 <= 4) return 'дела';
  return 'дел';
}

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function loadCases() {
    try {
      const token = getAccessToken();
      if (!token) return;
      const data = await casesApi.getAll(token);
      setCases(data as CaseItem[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCases(); }, []);

  const filtered = cases.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.caseType?.name.toLowerCase().includes(search.toLowerCase()),
  );

  const now = mounted ? new Date() : null;

  function overdueCount(c: CaseItem): number {
    if (!now) return 0;
    return (
      c.tasks?.filter(
        (t) =>
          t.status !== 'completed' &&
          t.dueDate &&
          new Date(t.dueDate) < now,
      ).length ?? 0
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Дела</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Управление юридическими делами
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="h-9 px-3 text-sm">
            <Plus size={14} /> Новое дело
          </Button>
        </div>

        <Modal open={showForm} onClose={() => setShowForm(false)} title="Новое дело">
          <CaseForm onSuccess={() => { setShowForm(false); loadCases(); }} />
        </Modal>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, клиенту, типу..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Дело
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Клиент
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Тип
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Стадия
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Создано
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Briefcase
                      size={28}
                      className="mx-auto mb-3 text-muted-foreground/40"
                    />
                    <p className="text-sm text-muted-foreground">
                      {search ? 'Ничего не найдено' : 'Дел пока нет — создайте первое'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const overdue = overdueCount(item);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/cases/${item.id}`)}
                      className="cursor-pointer border-b border-border last:border-0 transition hover:bg-accent/40"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          {overdue > 0 && (
                            <span
                              className="flex items-center gap-1 text-[11px] font-semibold text-red-500"
                              title={`${overdue} просроченных задач`}
                            >
                              <AlertTriangle size={11} /> {overdue}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {item.client?.fullName ?? '—'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {item.caseType?.name ?? '—'}
                      </td>
                      <td className="p-4">
                        {item.stage ? (
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                            style={{
                              backgroundColor: item.stage.color ?? '#6366f1',
                            }}
                          >
                            {item.stage.name}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-right text-xs text-muted-foreground">
            {filtered.length} {pluralDela(filtered.length)}
          </p>
        )}
      </div>
    </AppShell>
  );
}
