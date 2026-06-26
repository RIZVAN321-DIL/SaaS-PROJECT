'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
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

// Предустановленные типы документов (п.31)
const DOCUMENT_TYPES = [
  'Договор',
  'Доверенность',
  'Акт',
  'Исковое заявление',
  'Ответ на претензию',
  'Претензия',
  'Справка',
  'Свидетельство',
  'Выписка',
  'Паспорт',
  'Другое',
];

export function DocumentUploadForm({ caseId, onSuccess }: DocumentUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [cases, setCases] = useState<CaseItem[]>([]);
  // п.29: если caseId передан как prop — не сбрасывать его при reset
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');

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
    loadCases();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected && !name) {
      // Убираем расширение из автозаполненного имени
      setName(selected.name.replace(/\.[^.]+$/, ''));
    }
  }

  function resetForm() {
    setFile(null);
    setName('');
    setType('');
    setError('');
    setProgress(0);
    // п.29: сбрасываем selectedCaseId только если он не был передан снаружи
    setSelectedCaseId(caseId || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();

    if (!token) { setError('Требуется авторизация'); return; }
    if (!file) { setError('Выберите файл'); return; }
    if (!selectedCaseId) { setError('Выберите дело'); return; }

    try {
      setLoading(true);
      setError('');
      setProgress(10);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name || file.name);
      if (type) formData.append('type', type);
      formData.append('caseId', selectedCaseId);

      setProgress(40);
      await documentsApi.upload(formData, token);
      setProgress(100);

      resetForm();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить документ');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Дело */}
      {!caseId && (
        <div>
          <label className="mb-2 block text-sm font-medium">Дело</label>
          <select
            required
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          >
            <option value="">Выберите дело...</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Файл */}
      <div>
        <label className="mb-2 block text-sm font-medium">Файл</label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-6 transition hover:border-primary/60 hover:bg-accent/30">
          {file ? (
            <>
              <FileText size={24} className="text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} МБ
              </span>
            </>
          ) : (
            <>
              <Upload size={24} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Нажмите или перетащите файл
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, Word, Excel, изображения — до 50 МБ
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
          />
        </label>
      </div>

      {/* Название */}
      <div>
        <Input
          label="Название документа"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Договор аренды"
        />
        {file && name && (
          <p className="mt-1 text-xs text-muted-foreground">
            Название заполнено из имени файла — можете изменить
          </p>
        )}
      </div>

      {/* Тип — select вместо input (п.31) */}
      <div>
        <label className="mb-2 block text-sm font-medium">Тип документа</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
        >
          <option value="">Не указан</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Прогресс загрузки (UX-4) */}
      {loading && progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Загрузка...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Загрузить документ
      </Button>
    </form>
  );
      }
