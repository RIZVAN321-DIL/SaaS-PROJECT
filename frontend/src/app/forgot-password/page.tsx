'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      // Бэкенд всегда отвечает одинаково, есть такой email или нет —
      // поэтому мы просто показываем общий экран "ссылка отправлена".
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось отправить запрос',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        {sent ? (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold">Проверьте почту</h1>
            <p className="text-sm text-muted-foreground">
              Если аккаунт с email <strong>{email}</strong> существует, на
              него отправлена ссылка для сброса пароля.
            </p>
            <a href="/login" className="inline-block text-sm text-primary hover:underline">
              ← Вернуться ко входу
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Восстановление пароля</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Укажите email — мы отправим ссылку для сброса пароля
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
                  placeholder="you@firma.ru"
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
                {loading ? 'Отправляем...' : 'Отправить ссылку'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Вспомнили пароль?{' '}
              <a href="/login" className="text-primary hover:underline">
                Войти
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
