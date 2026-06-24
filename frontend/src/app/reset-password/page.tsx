'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Lock } from 'lucide-react';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    if (password.length < 6) { setError('Пароль должен быть не короче 6 символов'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ссылка недействительна или устарела');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <Lock size={32} className="mx-auto mb-4 text-muted-foreground/40" />
        <h1 className="text-xl font-bold">Ссылка недействительна</h1>
        <p className="mt-2 text-sm text-muted-foreground">В ссылке отсутствует токен сброса пароля.</p>
        <a href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Запросить новую ссылку</a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold">Пароль изменён</h1>
        <p className="mt-2 text-sm text-muted-foreground">Перенаправляем на страницу входа...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Новый пароль</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Придумайте надёжный пароль для входа</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Новый пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" placeholder="Минимум 6 символов" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Повторите пароль</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" placeholder="Повторите новый пароль" />
        </div>
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">{error}</div>}
        <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{loading ? 'Сохраняем...' : 'Сохранить новый пароль'}</button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
