'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authApi } from '@/lib/api';
import { saveLogin } from '@/lib/auth';

interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  requiresTwoFactor?: boolean;
  challengeId?: string;
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center border-r border-border bg-card p-12">
        <div className="flex flex-col items-center gap-8">
          <Image src="/logo-banner.svg" alt="CaseFlow" width={280} height={280} priority className="opacity-90" />
          <div className="text-center">
            <h2 className="text-xl font-bold">CaseFlow</h2>
            <p className="mt-1 text-sm text-muted-foreground">Юридическая CRM нового поколения</p>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = (await authApi.login({ email, password })) as LoginResponse;
      if (response.requiresTwoFactor && response.challengeId) {
        setChallengeId(response.challengeId);
        setLoading(false);
        return;
      }
      saveLogin(response as { access_token: string; refresh_token: string });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.verifyTwoFactor({ challengeId, code });
      saveLogin(response as { access_token: string; refresh_token: string });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  }

  if (challengeId) {
    return (
      <AuthLayout>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Код подтверждения</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Мы отправили 6-значный код на вашу почту</p>
        </div>
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Код из письма</label>
            <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus className="h-12 w-full rounded-xl border border-border bg-background px-4 text-center text-lg tracking-[0.5em] outline-none focus:border-primary" placeholder="000000" />
          </div>
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">{error}</div>}
          <button type="submit" disabled={loading || code.length !== 6} className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{loading ? 'Проверяем...' : 'Подтвердить'}</button>
          <button type="button" onClick={() => { setChallengeId(''); setCode(''); setError(''); }} className="w-full text-center text-sm text-muted-foreground hover:underline">← Назад ко входу</button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Добро пожаловать</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Войдите в свою организацию</p>
      </div>
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" placeholder="you@firma.ru" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Пароль</label>
            <a href="/forgot-password" className="text-xs text-primary hover:underline">Забыли пароль?</a>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" placeholder="••••••••" />
        </div>
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">{error}</div>}
        <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{loading ? 'Входим...' : 'Войти'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Нет аккаунта? <a href="/register" className="font-medium text-primary hover:underline">Зарегистрироваться</a></p>
    </AuthLayout>
  );
}
