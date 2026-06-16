'use client';

interface CaseHeaderProps {
  caseData: {
    title: string;
    description?: string;
    stage?: { name: string };
  };
}

export function CaseHeader({ caseData }: CaseHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {caseData.title}
          </h1>

          {caseData.description && (
            <p className="mt-2 text-muted-foreground">
              {caseData.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-border px-3 py-1 text-xs">
            {caseData.stage?.name ?? 'Без стадии'}
          </span>
        </div>
      </div>
    </div>
  );
}
