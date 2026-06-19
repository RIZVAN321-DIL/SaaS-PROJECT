// Файл 5: frontend/src/app/cases/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { CaseForm } from '@/components/forms/case-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface CaseItem {
  id: string;
  title: string;
  description?: string;

  client?: {
    id: string;
    fullName: string;
  };

  caseType?: {
    id: string;
    name: string;
  };

  stage?: {
    id: string;
    name: string;
  };

  createdAt: string;
}

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadCases() {
    try {
      const token = getAccessToken();
      if (!token) return;
      const data = await casesApi.getAll(token);
      setCases(data as CaseItem[]);
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Дела
            </h1>
            <p className="text-muted-foreground">
              Управление юридическими делами
            </p>
          </div>

          <Button onClick={() => setShowForm(true)}>
            Новое дело
          </Button>
        </div>

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Новое дело"
        >
          <CaseForm
            onSuccess={() => {
              setShowForm(false);
              loadCases();
            }}
          />
        </Modal>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">Название</th>
                <th className="p-4 text-left">Клиент</th>
                <th className="p-4 text-left">Тип</th>
                <th className="p-4 text-left">Стадия</th>
                <th className="p-4 text-left">Создано</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    Загрузка...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    Дел пока нет
                  </td>
                </tr>
              ) : (
                cases.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/cases/${item.id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition"
                  >
                    <td className="p-4">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description ?? ''}
                      </div>
                    </td>
                    <td className="p-4">{item.client?.fullName ?? '-'}</td>
                    <td className="p-4">{item.caseType?.name ?? '-'}</td>
                    <td className="p-4">
                      <span className="rounded-lg border border-border px-3 py-1 text-xs">
                        {item.stage?.name ?? '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
