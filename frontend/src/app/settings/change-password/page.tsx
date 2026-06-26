'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { getAccessToken, getUser } from '@/lib/auth';
import { toast } from '@/lib/toast';

const API_URL = 'https://saas-project-deog.onrender.com/api';

// Требования к паролю (должны совпадать с бэкенд-DTO)
const PASSWORD_RULES = [
  { label: 'Минимум 8 символов', test: (v: string) => v.length >= 8 },
  { label: 'Хотя бы одна буква', test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: 'Хотя бы одна цифра', test: (v: string) => /\d/.test(v) },
];

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required
          className="h-11 w-full rounded-xl border border-border bg-background px-4 pr-10 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = getUser();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const rules = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(next) }));
  const newPasswordValid = rules.every((r) => r.ok);
  const passwordsMatch = next === confirm;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!newPasswordValid) {
      setError('Новый пароль не соответствует требованиям');
      return;
    }
    if (!passwordsMatch) {
      setError('Пароли не совпадают');
      return;
    }
    if (current === next) {
      setError('Новый пароль должен отличаться от текущего');
      return;
    }

    const token = getAccessToken();
    if (!token || !user) {
      setError('Требуется авторизация');
      return;
    }

    setLoading(true);
    try {
      // Сначала проверяем текущий пароль через /auth/login
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: current }),
      });

      if (!loginRes.ok) {
        setError('Текущий пароль неверен');
        setLoading(false);
        return;
      }

      // Запрашиваем токен сброса для авторизованного пользователя
      const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      if (!forgotRes.ok) {
        setError('Не удалось инициировать смену пароля. Попробуйте позже.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Письмо со ссылкой для смены пароля отправлено на ваш email');
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold">Проверьте почту</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Письмо со ссылкой для установки нового пароля отправлено на{' '}
              <strong>{user?.email}</strong>. Ссылка действует 1 час.
            </p>
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="mt-6 text-sm font-medium text-primary hover:underline"
            >
              ← Вернуться в настройки
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-5">
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} /> Настройки
        </button>

        <div>
          <h1 className="text-2xl font-bold">Смена пароля</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Введите текущий пароль для подтверждения
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              label="Текущий пароль"
              value={current}
              onChange={setCurrent}
              placeholder="Введите текущий пароль"
              autoFocus
            />

            <PasswordInput
              label="Новый пароль"
              value={next}
              onChange={setNext}
              placeholder="Минимум 8 символов"
            />

            {/* Индикатор требований */}
            {next && (
              <div className="space-y-1.5 rounded-xl border border-border/60 p-3">
                {rules.map((r) => (
                  <div
                    key={r.label}
                    className={`flex items-center gap-2 text-xs ${
                      r.ok ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        r.ok ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                      }`}
                    />
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            <PasswordInput
              label="Повторите новый пароль"
              value={confirm}
              onChange={setConfirm}
              placeholder="Повторите новый пароль"
            />

            {confirm && !passwordsMatch && (
              <p className="text-xs text-red-500">Пароли не совпадают</p>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!current || !newPasswordValid || !passwordsMatch}
              className="w-full"
            >
              Сменить пароль
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
        }
