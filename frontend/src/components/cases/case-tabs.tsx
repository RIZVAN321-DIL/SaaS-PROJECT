'use client';

interface CaseTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Обзор' },
  { id: 'tasks', label: 'Задачи' },
  { id: 'documents', label: 'Документы' },
  { id: 'activity', label: 'Активность' },
];

export function CaseTabs({
  activeTab,
  onChange,
}: CaseTabsProps) {
  return (
    <div className="flex gap-2 border-b border-border">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition ${
              active
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
