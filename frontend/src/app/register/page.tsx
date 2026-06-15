'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { saveLogin } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Сначала создаём организацию
      const orgRes = await fetch('https://saas-project-deog.onrender.com/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName }),
      });
      
      if (!orgRes.ok) throw new Error('Ошибка создания организации');
      
      const org = await orgRes.json();

      // Регистрируем пользователя
      const response = await authApi.register({
        email,
        password,
        organizationId: org.id,
      });

      saveLogin(response as { access_token: string; refresh_token: string });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Регистрация</h1>
          <p className="mt-2 text-sm text-muted-foreground">Создайте аккаунт для вашей юридической фирмы</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Название организации</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
              placeholder="Моя юридическая фирма"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
              placeholder="admin@firma.ru"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
              placeholder="Минимум 6 символов"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Создаём...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <a href="/login" className="text-primary hover:underline">
            Войти
          </a>
        </p>
      </div>
    </main>
  );
        }
