// Файл 4: frontend/src/components/forms/client-form.tsx
'use client';

import { FormEvent, useState } from 'react';

import { clientsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClientToEdit {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface ClientFormProps {
  clientToEdit?: ClientToEdit;
  onSuccess?: () => void;
}

export function ClientForm({ clientToEdit, onSuccess }: ClientFormProps) {
  const isEditing = Boolean(clientToEdit);

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(clientToEdit?.fullName ?? '');
  const [email, setEmail] = useState(clientToEdit?.email ?? '');
  const [phone, setPhone] = useState(clientToEdit?.phone ?? '');
  const [notes, setNotes] = useState(clientToEdit?.notes ?? '');
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

      const payload = {
        fullName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditing && clientToEdit) {
        await clientsApi.update(clientToEdit.id, payload, token);
      } else {
        await clientsApi.create(payload, token);

        setFullName('');
        setEmail('');
        setPhone('');
        setNotes('');
      }

      onSuccess?.();
    } catch {
      setError(
        isEditing ? 'Не удалось сохранить изменения' : 'Не удалось создать клиента',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Полное имя"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        placeholder="Имя клиента"
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="client@email.com"
      />

      <Input
        label="Телефон"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+7 ..."
      />

      <div>
        <label className="mb-2 block text-sm font-medium">Заметки</label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
          placeholder="Дополнительная информация"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 p-3 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {isEditing ? 'Сохранить изменения' : 'Создать клиента'}
      </Button>
    </form>
  );
}
