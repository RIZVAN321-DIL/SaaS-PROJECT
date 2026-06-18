// frontend/src/components/forms/document-upload-form.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';

import { documentsApi, casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CaseItem {
  id: string;
  title: string;
}

interface DocumentUploadFormProps {
  caseId?: string;
  onSuccess?: () => void;
}

export function DocumentUploadForm({ caseId, onSuccess }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');

  useEffect(() => {
    async function loadCases() {
      const token = getAccessToken();

      if (!token) {
        return;
      }

      try {
        const data = await casesApi.getAll(token);
        setCases(data as CaseItem[]);
      } catch {
        // silently fail
      }
    }

    loadCases();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected && !name) {
      setName(selected.name);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const token = getAccessToken();

    if (!token) {
      setError('Требуется авторизация');
      return;
    }

    if (!file) {
      setError('Файл обязателен');
      return;
    }

    if (!selectedCaseId) {
      setError('Выберите дело');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);

      if (type) {
        formData.append('type', type);
      }

      formData.append('caseId', selectedCaseId);

      await documentsApi.upload(formData, token);

      setFile(null);
      setName('');
      setType('');
      setSelectedCaseId('');

      onSuccess?.();
    } catch {
      setError('Не удалось загрузить документ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">Дело</label>

        <select
          required
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
        >
          <option value="">Выберите дело</option>

          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <Input label="Файл" type="file" onChange={handleFileChange} />

      <Input
        label="Название документа"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Договор.pdf"
      />

      <Input
        label="Тип"
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Договор / Доказательство / Другое"
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 p-3 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Загрузить документ
      </Button>
    </form>
  );
}
