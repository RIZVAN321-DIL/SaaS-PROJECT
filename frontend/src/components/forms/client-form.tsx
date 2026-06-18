// frontend/src/components/forms/client-form.tsx
'use client';

import { FormEvent, useState } from 'react';

import { clientsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClientFormProps {
  onSuccess?: () => void;
}

export function ClientForm({ onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
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

      await clientsApi.create(
        {
          fullName,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        token,
      );

      setFullName('');
      setEmail('');
      setPhone('');
      setNotes('');

      onSuccess?.();
    } catch {
      setError('Не удалось создать клиента');
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
        Создать клиента
      </Button>
    </form>
  );
}
