'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { Mail, CheckCircle2 } from 'lucide-react';

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
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить запрос');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold">Проверьте почту</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Если аккаунт с адресом <strong>{email}</strong> существует, на него отправлена ссылка для сброса пароля.
            </p>
            <a href="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">← Вернуться ко входу</a>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Восстановление пароля</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Укажите email — мы отправим ссылку для сброса пароля</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary" placeholder="you@firma.ru" />
                </div>
              </div>
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">{error}</div>}
              <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{loading ? 'Отправляем...' : 'Отправить ссылку'}</button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">Вспомнили пароль? <a href="/login" className="font-medium text-primary hover:underline">Войти</a></p>
          </div>
        )}
      </div>
    </main>
  );
}
