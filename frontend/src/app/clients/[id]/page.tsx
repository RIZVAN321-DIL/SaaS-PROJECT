// Файл 9 (НОВЫЙ): frontend/src/app/clients/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { clientsApi, caseStagesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { ClientForm } from '@/components/forms/client-form';
import { CaseForm } from '@/components/forms/case-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface ClientCase {
  id: string;
  title: string;
  description?: string;
  stageId?: string;
  caseTypeId?: string;
  createdAt: string;
}

interface ClientDetail {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  cases: ClientCase[];
}

interface Stage {
  id: string;
  name: string;
  color?: string;
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params.id;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadClient() {
    const token = getAccessToken();
    if (!token) return;

    try {
      const data = (await clientsApi.getById(clientId, token)) as ClientDetail;
      setClient(data);
      setNotFound(false);
    } catch {
      setNotFound(true);
    }
  }

  async function loadStages() {
    const token = getAccessToken();
    if (!token) return;

    try {
      const data = (await caseStagesApi.getAll(token)) as Stage[];
      setStages(data);
    } catch {
      // silently fail
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadClient(), loadStages()]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleDeleteClient() {
    const token = getAccessToken();
    if (!token) return;

    const confirmed = window.confirm(
      'Удалить этого клиента? Действие необратимо.',
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await clientsApi.remove(clientId, token);
      router.push('/clients');
    } finally {
      setDeleting(false);
    }
  }

  function stageName(stageId?: string) {
    if (!stageId) return '-';
    return stages.find((s) => s.id === stageId)?.name ?? '-';
  }

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          Загрузка клиента...
        </div>
      </AppShell>
    );
  }

  if (notFound || !client) {
    return (
      <AppShell>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium">Клиент не найден</p>
          <Button onClick={() => router.push('/clients')}>
            Вернуться к списку клиентов
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push('/clients')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Все клиенты
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold break-words">
              {client.fullName}
            </h1>

            <p className="mt-1 text-muted-foreground">
              Клиент с {new Date(client.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setShowEditModal(true)}>
              Редактировать
            </Button>

            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDeleteClient}
            >
              Удалить
            </Button>
          </div>
        </div>

        <Modal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Редактировать клиента"
        >
          <ClientForm
            clientToEdit={{
              id: client.id,
              fullName: client.fullName,
              email: client.email,
              phone: client.phone,
              notes: client.notes,
            }}
            onSuccess={() => {
              setShowEditModal(false);
              loadClient();
            }}
          />
        </Modal>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Контакты</h2>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{client.email ?? '-'}</dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Телефон</dt>
                <dd>{client.phone ?? '-'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Заметки</h2>

            <p className="whitespace-pre-wrap text-sm">
              {client.notes || 'Заметок пока нет'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Дела клиента ({client.cases.length})
          </h2>

          <Button onClick={() => setShowCaseModal(true)}>
            Новое дело
          </Button>
        </div>

        <Modal
          open={showCaseModal}
          onClose={() => setShowCaseModal(false)}
          title="Новое дело"
        >
          <CaseForm
            clientId={client.id}
            onSuccess={() => {
              setShowCaseModal(false);
              loadClient();
            }}
          />
        </Modal>

        {client.cases.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            У этого клиента пока нет дел
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left">Дело</th>
                  <th className="p-4 text-left">Стадия</th>
                  <th className="p-4 text-left">Создано</th>
                </tr>
              </thead>

              <tbody>
                {client.cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/cases/${c.id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition"
                  >
                    <td className="p-4">
                      <div className="font-medium">{c.title}</div>

                      {c.description && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {c.description}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="rounded-lg border border-border px-3 py-1 text-xs">
                        {stageName(c.stageId)}
                      </span>
                    </td>

                    <td className="p-4">
                      {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
          }
