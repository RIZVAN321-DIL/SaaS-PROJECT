'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface BoardCase {
  id: string;
  title: string;
  client?: { fullName: string };
  caseType?: { name: string };
}

interface Stage {
  id: string;
  name: string;
  color?: string;
  cases: BoardCase[];
}

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);

  async function loadBoard() {
    try {
      const token = getAccessToken();
      if (!token) return;
      const data = await casesApi.getBoard(token);
      setStages(data as Stage[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBoard(); }, []);

  async function moveCase(caseId: string, stageId: string) {
    const token = getAccessToken();
    if (!token) return;

    // Оптимистичное обновление
    const previous = [...stages];
    setStages((current) => {
      const dragged = current
        .flatMap((s) => s.cases)
        .find((c) => c.id === caseId);
      if (!dragged) return current;
      return current.map((stage) => {
        if (stage.id === stageId) {
          return { ...stage, cases: [...stage.cases, dragged] };
        }
        return { ...stage, cases: stage.cases.filter((c) => c.id !== caseId) };
      });
    });

    try {
      await casesApi.move(caseId, stageId, token);
    } catch {
      // Откатываем при ошибке
      setStages(previous);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Воронка дел</h1>
          <p className="text-sm text-muted-foreground">
            Канбан-доска для управления делами
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse rounded-2xl border border-border"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedCaseId) {
                    moveCase(draggedCaseId, stage.id);
                  }
                  setDraggedCaseId(null);
                }}
                className="min-h-[600px] min-w-[260px] max-w-[260px] rounded-2xl border border-border bg-card p-3"
              >
                {/* Заголовок колонки */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stage.color && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                    )}
                    <h2 className="text-sm font-semibold">{stage.name}</h2>
                  </div>
                  <span className="rounded-lg border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {stage.cases.length}
                  </span>
                </div>

                {/* Карточки дел */}
                <div className="space-y-2">
                  {stage.cases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      draggable
                      onDragStart={() => setDraggedCaseId(caseItem.id)}
                      onClick={() => router.push(`/cases/${caseItem.id}`)}
                      className="cursor-pointer rounded-xl border border-border bg-background p-3 transition hover:shadow-md hover:border-primary/40 active:cursor-grabbing"
                      title="Открыть дело"
                    >
                      <h3 className="text-sm font-medium leading-snug">
                        {caseItem.title}
                      </h3>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {caseItem.client?.fullName ?? 'Без клиента'}
                      </div>
                      {caseItem.caseType?.name && (
                        <div className="mt-1 text-xs text-muted-foreground/70">
                          {caseItem.caseType.name}
                        </div>
                      )}
                    </div>
                  ))}

                  {stage.cases.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground/50">
                      Нет дел
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
