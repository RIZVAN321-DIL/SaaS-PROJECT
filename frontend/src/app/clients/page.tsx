'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Phone, Mail } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { clientsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { ClientForm } from '@/components/forms/client-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Client {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  cases?: { id: string }[];
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  async function loadClients() {
    try {
      const token = getAccessToken();
      if (!token) return;
      const data = await clientsApi.getAll(token);
      const list = Array.isArray(data) ? (data as Client[]) : ((data as { items?: Client[] }).items ?? []);
      setClients(list);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClients(); }, []);

  const filtered = clients.filter(
    (c) =>
      !search ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search),
  );

  function initials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Клиенты</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Управление клиентской базой</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="h-9 px-3 text-sm">
            <Plus size={14} /> Новый клиент
          </Button>
        </div>

        <Modal open={showForm} onClose={() => setShowForm(false)} title="Новый клиент">
          <ClientForm onSuccess={() => { setShowForm(false); loadClients(); }} />
        </Modal>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, email, телефону..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Users size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? 'Ничего не найдено' : 'Клиентов пока нет — добавьте первого'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}`)}
                className="cursor-pointer rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials(client.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{client.fullName}</p>
                    {client.email && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail size={10} /> {client.email}
                      </p>
                    )}
                    {client.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone size={10} /> {client.phone}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {client.cases?.length ?? 0} дел
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-right text-xs text-muted-foreground">{filtered.length} клиентов</p>
        )}
      </div>
    </AppShell>
  );
}
