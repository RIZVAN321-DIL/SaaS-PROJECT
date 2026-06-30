'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { saveLogin } from '@/lib/auth';

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <img
          src="/logo-banner.svg"
          alt="CaseFlow"
          className="h-auto w-[200px] sm:w-[260px]"
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

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function passwordStrength(p: string): { label: string; color: string; width: string } {
    if (p.length === 0) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Слабый', color: 'bg-red-500', width: '25%' };
    if (score === 2) return { label: 'Средний', color: 'bg-amber-500', width: '50%' };
    if (score === 3) return { label: 'Хороший', color: 'bg-blue-500', width: '75%' };
    return { label: 'Надёжный', color: 'bg-emerald-500', width: '100%' };
  }

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.registerOrganization({
        organizationName: orgName,
        email,
        password,
        referralCode: referralCode.trim().toUpperCase() || undefined,
      });
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
      <div className="mb-6">
        <h1 className="text-xl font-bold">Создать аккаунт</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Зарегистрируйте вашу юридическую фирму
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Название организации
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            minLength={2}
            autoFocus
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
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
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
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
            minLength={8}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            placeholder="Минимум 8 символов"
          />
          {password && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Реферальный код */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Реферальный код{' '}
            <span className="font-normal text-muted-foreground">(необязательно)</span>
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            maxLength={12}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 font-mono text-sm uppercase tracking-widest outline-none focus:border-primary"
            placeholder="A1B2C3D4"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Если вас пригласила другая организация — введите её код и получите первый месяц бесплатно
          </p>
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
          {loading ? 'Загрузка...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <a href="/login" className="font-medium text-primary hover:underline">
          Войти
        </a>
      </p>
    </AuthLayout>
  );
}
