'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { saveLogin } from '@/lib/auth';

interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  requiresTwoFactor?: boolean;
  challengeId?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Шаг проверки кода 2FA
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [code, setCode] = useState('');

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = (await authApi.login({
        email,
        password,
      })) as LoginResponse;

      if (response.requiresTwoFactor) {
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      saveLogin(
        response as { access_token: string; refresh_token: string },
      );
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed',
      );
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Отправляем email вместе с кодом
      const response = await authApi.verifyTwoFactor({
        challengeId: email,
        code,
      });
      saveLogin(
        response as { access_token: string; refresh_token: string },
      );
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неверный код',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        {showTwoFactor ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">
                Код подтверждения
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Мы отправили 6-значный код на вашу почту. Введите его ниже.
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Код из письма
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, ''))
                  }
                  required
                  autoFocus
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-center text-lg tracking-[0.5em] outline-none"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Проверяем...' : 'Подтвердить'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTwoFactor(false);
                  setCode('');
                  setError('');
                }}
                className="w-full text-center text-sm text-muted-foreground hover:underline"
              >
                ← Назад ко входу
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Welcome Back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to your CRM
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium">Password</label>
                  <a href="/forgot-password" className="text-sm text-primary hover:underline">
                    Забыли пароль?
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 p-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <a href="/register" className="text-primary hover:underline">
                Зарегистрироваться
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
                    }
