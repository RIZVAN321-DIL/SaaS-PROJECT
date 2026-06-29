'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { casesApi, clientsApi, caseTypesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  fullName: string;
}

interface CaseType {
  id: string;
  name: string;
}

interface CaseToEdit {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  caseTypeId?: string;
}

interface CaseFormProps {
  clientId?: string;
  caseToEdit?: CaseToEdit;
  onSuccess?: () => void;
}

export function CaseForm({ clientId, caseToEdit, onSuccess }: CaseFormProps) {
  const isEditing = Boolean(caseToEdit);
  const lockClient = Boolean(clientId) && !isEditing;

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [title, setTitle] = useState(caseToEdit?.title ?? '');
  const [description, setDescription] = useState(caseToEdit?.description ?? '');
  const [selectedClientId, setSelectedClientId] = useState(
    caseToEdit?.clientId ?? clientId ?? '',
  );
  const [caseTypeId, setCaseTypeId] = useState(caseToEdit?.caseTypeId ?? '');
  const [error, setError] = useState('');

  // Новый клиент на лету
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;

      try {
        const [clientsData, caseTypesData] = await Promise.all([
          clientsApi.getAll(token),
          caseTypesApi.getAll(token),
        ]);

        const list = Array.isArray(clientsData)
          ? (clientsData as Client[])
          : ((clientsData as { items?: Client[] }).items ?? []);
        setClients(list);
        setCaseTypes(caseTypesData as CaseType[]);
      } catch {
        setError('Не удалось загрузить данные');
      }
    }

    loadData();
  }, []);

  async function handleCreateClient() {
    const token = getAccessToken();
    if (!token || !newClientName.trim()) return;

    setCreatingClient(true);
    try {
      const payload: Record<string, string> = { fullName: newClientName.trim() };
      if (newClientPhone.trim()) payload.phone = newClientPhone.trim();
      if (newClientEmail.trim()) payload.email = newClientEmail.trim();

      const created = await clientsApi.create(payload, token) as { id: string; fullName: string };
      
      setClients((prev) => [{ id: created.id, fullName: created.fullName }, ...prev]);
      setSelectedClientId(created.id);
      
      // Сброс формы нового клиента
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
    } catch {
      setError('Не удалось создать клиента');
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const token = getAccessToken();
    if (!token) {
      setError('Требуется авторизация');
      return;
    }

    if (!selectedClientId) {
      setError('Выберите клиента');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        title,
        description: description.trim() || undefined,
        clientId: selectedClientId,
        caseTypeId: caseTypeId || undefined,
      };

      if (isEditing && caseToEdit) {
        await casesApi.update(caseToEdit.id, payload, token);
      } else {
        await casesApi.create(payload, token);

        setTitle('');
        setDescription('');
        if (!clientId) setSelectedClientId('');
        setCaseTypeId('');
      }

      onSuccess?.();
    } catch {
      setError(
        isEditing ? 'Не удалось сохранить изменения' : 'Не удалось создать дело',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Название дела"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Спор по договору"
      />

      {!lockClient && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Клиент</label>
            {!showNewClient && (
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus size={12} /> Новый клиент
              </button>
            )}
          </div>

          {/* Inline-форма создания клиента */}
          {showNewClient && (
            <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <Input
                label="ФИО"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Иванов Иван Иванович"
              />
              <Input
                label="Телефон"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="+7 ..."
              />
              <Input
                label="Email"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="client@email.com"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCreateClient}
                  loading={creatingClient}
                  disabled={!newClientName.trim()}
                  className="flex-1 h-9 text-sm"
                >
                  Создать клиента
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewClient(false)}
                  className="h-9 text-sm"
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          <select
            required
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">Тип дела</label>
        <select
          value={caseTypeId}
          onChange={(e) => setCaseTypeId(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
        >
          <option value="">Выберите тип</option>
          {caseTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Описание</label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
          placeholder="Детали дела..."
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 p-3 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {isEditing ? 'Сохранить изменения' : 'Создать дело'}
      </Button>
    </form>
  );
}
