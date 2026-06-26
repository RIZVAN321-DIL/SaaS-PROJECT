'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, Lock } from 'lucide-react';
import { authApi } from '@/lib/api';

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/logo-banner.svg"
          alt="CaseFlow"
          width={220}
          height={72}
          priority
          className="h-auto w-[180px] sm:w-[220px]"
        />
        <p className="text-sm text-muted-foreground">
          Юридическая CRM нового поколения
        </p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="py-4 text-center">
        <Lock size={32} className="mx-auto mb-4 text-muted-foreground/40" />
        <h1 className="text-xl font-bold">Ссылка недействительна</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          В ссылке отсутствует токен сброса пароля.
        </p>
        <a
          href="/forgot-password"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Запросить новую ссылку
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold">Пароль изменён</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Перенаправляем на страницу входа...
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Валидация на фронте совпадает с бэкенд-DTO (п.23: минимум 8 + буква + цифра)
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError('Пароль должен содержать хотя бы одну букву');
      return;
    }
    if (!/\d/.test(password)) {
      setError('Пароль должен содержать хотя бы одну цифру');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ссылка недействительна или устарела',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Новый пароль</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Придумайте надёжный пароль для входа
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Новый пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            placeholder="Минимум 8 символов, буква и цифра"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Повторите пароль</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            placeholder="Повторите новый пароль"
          />
        </div>
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Сохраняем...' : 'Сохранить новый пароль'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-muted-foreground">
            Загрузка...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
