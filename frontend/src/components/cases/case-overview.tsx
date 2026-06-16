'use client';

interface CaseOverviewProps {
  caseData: {
    client?: { fullName: string };
    caseType?: { name: string };
    stage?: { name: string };
    createdAt: string;
    updatedAt?: string;
  };
}

export function CaseOverview({
  caseData,
}: CaseOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Информация
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Клиент
            </span>
            <span>
              {caseData.client?.fullName ?? '-'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Тип дела
            </span>
            <span>
              {caseData.caseType?.name ?? '-'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Стадия
            </span>
            <span>
              {caseData.stage?.name ?? '-'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Создано
            </span>
            <span>
              {new Date(caseData.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Быстрые действия
        </h3>

        <div className="space-y-3">
          <button className="w-full rounded-xl border border-border px-4 py-3 text-sm hover:bg-accent">
            Добавить задачу
          </button>

          <button className="w-full rounded-xl border border-border px-4 py-3 text-sm hover:bg-accent">
            Загрузить документ
          </button>

          <button className="w-full rounded-xl border border-border px-4 py-3 text-sm hover:bg-accent">
            Изменить стадию
          </button>
        </div>
      </div>
    </div>
  );
}
