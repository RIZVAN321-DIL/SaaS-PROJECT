'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { clientsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { ClientForm } from '@/components/forms/client-form';

interface Client {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  cases?: unknown[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadClients() {
    try {
      const token = getAccessToken();
      if (!token) return;
      const data = await clientsApi.getAll(token);
      setClients(data as Client[]);
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Клиенты
            </h1>
            <p className="text-muted-foreground">
              Управление клиентами
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Новый клиент
          </button>
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowForm(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold">
                Новый клиент
              </h2>
              <ClientForm
                onSuccess={() => {
                  setShowForm(false);
                  loadClients();
                }}
              />
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left">Имя</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Телефон</th>
                <th className="p-4 text-left">Дел</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    Загрузка...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    Клиентов пока нет
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b border-border">
                    <td className="p-4 font-medium">
                      {client.fullName}
                    </td>
                    <td className="p-4">{client.email ?? '-'}</td>
                    <td className="p-4">{client.phone ?? '-'}</td>
                    <td className="p-4">{client.cases?.length ?? 0}</td>
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
