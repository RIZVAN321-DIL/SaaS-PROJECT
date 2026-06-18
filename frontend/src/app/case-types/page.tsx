// frontend/src/app/case-types/page.tsx
'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { CaseTypeForm } from '@/components/forms/case-type-form';
import { caseTypesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface CaseType {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function CaseTypesPage() {
  const [types, setTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadTypes() {
    try {
      const token = getAccessToken();

      if (!token) return;

      const data = await caseTypesApi.getAll(token);
      setTypes(data as CaseType[]);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTypes();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Типы дел
            </h1>

            <p className="text-muted-foreground">
              Управление шаблонами дел
            </p>
          </div>

          <Button onClick={() => setShowForm(true)}>
            Добавить тип дела
          </Button>
        </div>

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Новый тип дела"
        >
          <CaseTypeForm
            onSuccess={() => {
              setShowForm(false);
              loadTypes();
            }}
          />
        </Modal>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">Название</th>
                <th className="p-4 text-left">Описание</th>
                <th className="p-4 text-left">Создан</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    Загрузка...
                  </td>
                </tr>
              ) : types.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    Типов дел пока нет
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id} className="border-b border-border">
                    <td className="p-4 font-medium">{type.name}</td>

                    <td className="p-4">{type.description || '-'}</td>

                    <td className="p-4">
                      {new Date(type.createdAt).toLocaleDateString()}
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
