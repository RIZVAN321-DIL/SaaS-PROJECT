'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { CustomFieldsManager } from '@/components/forms/custom-fields-manager';
import { caseTypesApi } from '@/lib/api';
import { getAccessToken, getUser } from '@/lib/auth';

interface CaseType {
  id: string;
  name: string;
}

export default function CustomFieldsSettingsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [tab, setTab] = useState<'CLIENT' | 'CASE'>('CLIENT');
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = (await caseTypesApi.getAll(token)) as CaseType[];
        setCaseTypes(data);
      } catch {
        setCaseTypes([]);
      }
    }
    load();
  }, []);

  return (
    <AppShell>
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} /> Настройки
        </button>

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <SlidersHorizontal size={20} /> Настраиваемые поля
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Свои поля для клиентов и дел — адаптируйте CRM под вашу сферу без программиста
          </p>
        </div>

        <div className="flex gap-2 rounded-xl border border-border p-1">
          <button
            type="button"
            onClick={() => setTab('CLIENT')}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
              tab === 'CLIENT'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Поля клиента
          </button>
          <button
            type="button"
            onClick={() => setTab('CASE')}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
              tab === 'CASE'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Поля дела
          </button>
        </div>

        <CustomFieldsManager entityType={tab} caseTypes={caseTypes} />
      </div>
    </AppShell>
  );
}
