// frontend/src/components/forms/stage-form.tsx
'use client';

import { FormEvent, useState } from 'react';

import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const API_URL = 'https://saas-project-deog.onrender.com/api';

interface StageFormProps {
  onSuccess?: () => void;
}

export function StageForm({ onSuccess }: StageFormProps) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);
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

      const response = await fetch(`${API_URL}/case-stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          order: Number(order),
          color,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка создания стадии');
      }

      toast.success('Стадия создана');

      setName('');
      setOrder('');
      setColor('#3B82F6');

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания стадии');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Название стадии"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Новая стадия"
      />

      <Input
        label="Порядок"
        required
        type="number"
        min={0}
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        placeholder="1"
      />

      <div>
        <label className="mb-2 block text-sm font-medium">Цвет</label>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background px-2"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Создать стадию
      </Button>
    </form>
  );
}
