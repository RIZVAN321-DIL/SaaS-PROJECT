// Файл 3: frontend/src/components/forms/task-form.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';

import { tasksApi, casesApi, usersApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CaseItem {
  id: string;
  title: string;
}

interface UserItem {
  id: string;
  email: string;
}

interface TaskToEdit {
  id: string;
  title: string;
  description?: string;
  caseId: string;
  assignedToId?: string;
  dueDate?: string;
}

interface TaskFormProps {
  caseId?: string;
  taskToEdit?: TaskToEdit;
  onSuccess?: () => void;
}

export function TaskForm({ caseId, taskToEdit, onSuccess }: TaskFormProps) {
  const isEditing = Boolean(taskToEdit);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [title, setTitle] = useState(taskToEdit?.title ?? '');
  const [description, setDescription] = useState(taskToEdit?.description ?? '');
  const [selectedCaseId, setSelectedCaseId] = useState(
    taskToEdit?.caseId ?? caseId ?? '',
  );
  const [assignedToId, setAssignedToId] = useState(
    taskToEdit?.assignedToId ?? '',
  );
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate ? taskToEdit.dueDate.slice(0, 16) : '',
  );

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [casesData, usersData] = await Promise.all([
          casesApi.getAll(token),
          usersApi.getAll(token),
        ]);
        setCases(casesData as CaseItem[]);
        setUsers(usersData as UserItem[]);
      } catch {
        setError('Не удалось загрузить данные');
      }
    }
    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) { setError('Требуется авторизация'); return; }
    try {
      setLoading(true);
      setError('');

      const payload = {
        title,
        description: description.trim() || undefined,
        caseId: selectedCaseId,
        assignedToId: assignedToId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };

      if (isEditing && taskToEdit) {
        await tasksApi.update(taskToEdit.id, payload, token);
      } else {
        await tasksApi.create(payload, token);

        setTitle('');
        setDescription('');
        if (!caseId) setSelectedCaseId('');
        setAssignedToId('');
        setDueDate('');
      }

      onSuccess?.();
    } catch {
      setError(
        isEditing ? 'Не удалось сохранить изменения' : 'Не удалось создать задачу',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Название задачи"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Подготовить документы для суда"
      />

      {!caseId && (
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
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">Исполнитель</label>
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
        >
          <option value="">Не назначен</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.email}</option>
          ))}
        </select>
      </div>

      <Input
        label="Срок выполнения"
        type="datetime-local"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <div>
        <label className="mb-2 block text-sm font-medium">Описание</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Детали задачи..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 p-3 text-sm">{error}</div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {isEditing ? 'Сохранить изменения' : 'Создать задачу'}
      </Button>
    </form>
  );
}
