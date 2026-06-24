'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Mail, FileText, Pencil, Trash2, Plus, Briefcase } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { clientsApi, caseStagesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { ClientForm } from '@/components/forms/client-form';
import { CaseForm } from '@/components/forms/case-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';

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

  async function loadAll() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [clientData, stagesData] = await Promise.all([
        clientsApi.getById(clientId, token),
        caseStagesApi.getAll(token),
      ]);
      setClient(clientData as ClientDetail);
      setStages(stagesData as Stage[]);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [clientId]);

  async function handleDeleteClient() {
    const token = getAccessToken();
    if (!token || !client) return;
    if (!confirm(`Удалить клиента «${client.fullName}»? Действие необратимо.`)) return;
    setDeleting(true);
    try {
      await clientsApi.remove(clientId, token);
      toast.success('Клиент удалён');
      router.push('/clients');
    } catch {
      toast.error('Не удалось удалить клиента');
    } finally {
      setDeleting(false);
    }
  }

  function stageName(stageId?: string) {
    if (!stageId) return '—';
    return stages.find((s) => s.id === stageId)?.name ?? '—';
  }

  function stageColor(stageId?: string) {
    if (!stageId) return undefined;
    return stages.find((s) => s.id === stageId)?.color;
  }

  function initials(name: string) {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-muted-foreground">Загрузка...</div>
      </AppShell>
    );
  }

  if (notFound || !client) {
    return (
      <AppShell>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Клиент не найден</p>
          <Button variant="secondary" onClick={() => router.push('/clients')}>К списку клиентов</Button>
        </div>
      </AppShell>
    );
  }

  const rightPanel = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-4">
        <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Контакты</h4>
        <div className="space-y-2 text-sm">
          {client.email ? (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Mail size={13} /> {client.email}
            </a>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground"><Mail size={13} /> —</p>
          )}
          {client.phone ? (
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Phone size={13} /> {client.phone}
            </a>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground"><Phone size={13} /> —</p>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-border p-4">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Статистика</h4>
        <div className="space-y-1.5 text-sm">
          <p>Дел: <strong>{client.cases.length}</strong></p>
          <p className="text-muted-foreground">
            В системе с {new Date(client.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      {client.notes && (
        <div className="rounded-2xl border border-border p-4">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Заметки</h4>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <AppShell rightPanel={rightPanel}>
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать клиента">
        <ClientForm
          clientToEdit={{ id: client.id, fullName: client.fullName, email: client.email, phone: client.phone, notes: client.notes }}
          onSuccess={() => { setShowEditModal(false); toast.success('Данные клиента обновлены'); loadAll(); }}
        />
      </Modal>
      <Modal open={showCaseModal} onClose={() => setShowCaseModal(false)} title="Новое дело">
        <CaseForm clientId={client.id} onSuccess={() => { setShowCaseModal(false); toast.success('Дело создано'); loadAll(); }} />
      </Modal>

      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/clients" className="hover:underline">Клиенты</Link>
          <span>›</span>
          <span className="truncate font-medium text-foreground">{client.fullName}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials(client.fullName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.fullName}</h1>
              {client.email && <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Mail size={12} /> {client.email}</p>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={() => setShowEditModal(true)}><Pencil size={14} /> Редактировать</Button>
            <Button variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={handleDeleteClient} disabled={deleting}><Trash2 size={14} /> Удалить</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          {client.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {client.phone}</span>}
          <span className="flex items-center gap-1.5"><Briefcase size={14} /> {client.cases.length} {client.cases.length === 1 ? 'дело' : 'дел'}</span>
          <span className="flex items-center gap-1.5"><User size={14} /> С {new Date(client.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Briefcase size={15} /> Дела клиента <span className="text-xs font-normal text-muted-foreground">{client.cases.length}</span></h3>
            <button type="button" onClick={() => setShowCaseModal(true)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Plus size={12} /> Добавить</button>
          </div>
          {client.cases.length === 0 ? (
            <div className="py-8 text-center">
              <Briefcase size={24} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">У этого клиента пока нет дел</p>
              <button type="button" onClick={() => setShowCaseModal(true)} className="mt-3 text-xs font-semibold text-primary hover:underline">Создать первое дело</button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {client.cases.map((c) => {
                const color = stageColor(c.stageId);
                return (
                  <div key={c.id} onClick={() => router.push(`/cases/${c.id}`)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm transition hover:bg-accent/50">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{c.title}</span>
                      {c.description && <span className="ml-2 truncate text-xs text-muted-foreground">{c.description}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.stageId && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: color ?? '#6366f1' }}>{stageName(c.stageId)}</span>}
                      <span className="text-[11px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
