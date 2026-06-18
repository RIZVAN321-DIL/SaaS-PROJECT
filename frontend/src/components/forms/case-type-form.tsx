// frontend/src/components/forms/case-type-form.tsx
'use client';

import { FormEvent, useState } from 'react';

import { caseTypesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CaseTypeFormProps {
  onSuccess?: () => void;
}

export function CaseTypeForm({ onSuccess }: CaseTypeFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

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

      await caseTypesApi.create(
        {
          name,
          description: description.trim() || undefined,
        },
        token,
      );

      setName('');
      setDescription('');

      onSuccess?.();
    } catch {
      setError('Не удалось создать тип дела');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Название типа дела"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Например: Семейное право"
      />

      <div>
        <label className="mb-2 block text-sm font-medium">Описание</label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
          placeholder="Описание типа дела"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 p-3 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Создать тип дела
      </Button>
    </form>
  );
}
