// Файл 2: frontend/src/components/forms/case-form.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';

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

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();

      if (!token) {
        return;
      }

      try {
        const [clientsData, caseTypesData] = await Promise.all([
          clientsApi.getAll(token),
          caseTypesApi.getAll(token),
        ]);

        setClients(clientsData as Client[]);
        setCaseTypes(caseTypesData as CaseType[]);
      } catch {
        setError('Не удалось загрузить данные');
      }
    }

    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const token = getAccessToken();

    if (!token) {
      setError('Требуется авторизация');
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
          <label className="mb-2 block text-sm font-medium">Клиент</label>

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
