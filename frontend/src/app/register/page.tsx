'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authApi } from '@/lib/api';
import { saveLogin } from '@/lib/auth';

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

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.registerOrganization({ organizationName: orgName, email, password });
      saveLogin(response as { access_token: string; refresh_token: string });
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Создать аккаунт</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Зарегистрируйте вашу юридическую фирму</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Название организации</label>
          <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} required minLength={2} autoFocus className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" placeholder="Моя юридическая фирма" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" placeholder="admin@firma.ru" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" placeholder="Минимум 6 символов" />
        </div>
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">{error}</div>}
        <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Уже есть аккаунт? <a href="/login" className="font-medium text-primary hover:underline">Войти</a></p>
    </AuthLayout>
  );
}
