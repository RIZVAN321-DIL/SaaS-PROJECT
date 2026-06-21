'use client';

import { FormEvent, useEffect, useState } from 'react';
import { calendarApi, casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CaseItem {
  id: string;
  title: string;
}

interface CalendarEventFormProps {
  caseId?: string;
  onSuccess?: () => void;
}

export function CalendarEventForm({ caseId, onSuccess }: CalendarEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(caseId ?? '');

  useEffect(() => {
    async function loadCases() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = await casesApi.getAll(token);
        setCases(data as CaseItem[]);
      } catch {
        // silently fail
      }
    }
    if (!caseId) loadCases();
  }, [caseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      setError('Требуется авторизация');
      return;
    }
    if (!date) {
      setError('Укажите дату события');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await calendarApi.create(
        {
          title,
          description: description.trim() || undefined,
          date: new Date(date).toISOString(),
          caseId: selectedCaseId || undefined,
        },
        token,
      );
      setTitle('');
      setDescription('');
      setDate('');
      if (!caseId) setSelectedCaseId('');
      onSuccess?.();
    } catch {
      setError('Не удалось создать событие');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Название события"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Судебное заседание"
      />

      <Input
        label="Дата и время"
        required
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {!caseId && (
        <div>
          <label className="mb-2 block text-sm font-medium">
            Дело (необязательно)
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
          >
            <option value="">Без привязки к делу</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">
          Описание
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Детали события..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Создать событие
      </Button>
    </form>
  );
}
