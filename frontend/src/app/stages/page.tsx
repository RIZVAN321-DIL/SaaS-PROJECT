// frontend/src/app/stages/page.tsx
'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { StageForm } from '@/components/forms/stage-form';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

const API_URL = 'https://saas-project-deog.onrender.com/api';

interface Stage {
  id: string;
  name: string;
  order: number;
  color?: string;
  createdAt: string;
}

export default function StagesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadStages() {
    try {
      const token = getAccessToken();

      if (!token) return;

      const response = await fetch(`${API_URL}/case-stages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setStages(data);
    } catch {
      setStages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStages();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Стадии канбана
            </h1>

            <p className="text-muted-foreground">
              Управление этапами воронки дел
            </p>
          </div>

          <Button onClick={() => setShowForm(true)}>
            Добавить стадию
          </Button>
        </div>

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Новая стадия"
        >
          <StageForm
            onSuccess={() => {
              setShowForm(false);
              loadStages();
            }}
          />
        </Modal>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">Цвет</th>
                <th className="p-4 text-left">Название</th>
                <th className="p-4 text-left">Порядок</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    Загрузка...
                  </td>
                </tr>
              ) : stages.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    Стадий пока нет
                  </td>
                </tr>
              ) : (
                stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => (
                    <tr key={stage.id} className="border-b border-border">
                      <td className="p-4">
                        <div
                          className="h-5 w-5 rounded-full border"
                          style={{ backgroundColor: stage.color }}
                        />
                      </td>

                      <td className="p-4 font-medium">{stage.name}</td>

                      <td className="p-4">{stage.order}</td>
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
