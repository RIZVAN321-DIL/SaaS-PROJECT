'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { authApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(true);
  const [togglingTwoFactor, setTogglingTwoFactor] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as
      | 'light'
      | 'dark'
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    async function loadMe() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const me = (await authApi.me(token)) as {
          twoFactorEnabled: boolean;
          isPlatformAdmin: boolean;
        };
        setTwoFactorEnabled(me.twoFactorEnabled);
        setIsPlatformAdmin(me.isPlatformAdmin);
      } catch {
        // silently fail
      } finally {
        setLoadingTwoFactor(false);
      }
    }
    loadMe();
  }, []);

  function changeTheme(value: 'light' | 'dark') {
    setTheme(value);
    localStorage.setItem('theme', value);
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async function toggleTwoFactor() {
    const token = getAccessToken();
    if (!token) return;
    setTogglingTwoFactor(true);
    try {
      if (twoFactorEnabled) {
        await authApi.disableTwoFactor(token);
        setTwoFactorEnabled(false);
        toast.success('Двухфакторная аутентификация отключена');
      } else {
        await authApi.enableTwoFactor(token);
        setTwoFactorEnabled(true);
        toast.success('Двухфакторная аутентификация включена');
      }
    } catch {
      toast.error('Не удалось изменить настройку 2FA');
    } finally {
      setTogglingTwoFactor(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="text-muted-foreground">
            Системные настройки и персонализация
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Внешний вид</h2>
          <div className="flex gap-4">
            <button
              onClick={() => changeTheme('light')}
              className={`rounded-xl border px-5 py-3 transition ${
                theme === 'light' ? 'border-primary' : 'border-border'
              }`}
            >
              Светлая тема
            </button>
            <button
              onClick={() => changeTheme('dark')}
              className={`rounded-xl border px-5 py-3 transition ${
                theme === 'dark' ? 'border-primary' : 'border-border'
              }`}
            >
              Тёмная тема
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Команда</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Управляйте сотрудниками организации — приглашайте юристов и
            ассистентов, назначайте роли.
          </p>
          <button
            onClick={() => router.push('/settings/team')}
            className="rounded-xl bg-primary px-5 py-3 text-primary-foreground"
          >
            Управление командой
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Тариф и оплата</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Текущий тариф организации, оформление и управление подпиской.
          </p>
          <button
            onClick={() => router.push('/settings/billing')}
            className="rounded-xl bg-primary px-5 py-3 text-primary-foreground"
          >
            Перейти к тарифам
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Безопасность</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">
                  Двухфакторная аутентификация
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  При входе дополнительно потребуется код, отправленный на
                  email.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={twoFactorEnabled}
                disabled={loadingTwoFactor || togglingTwoFactor}
                onClick={toggleTwoFactor}
                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
                  twoFactorEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <button
                onClick={() => router.push('/forgot-password')}
                className="rounded-xl border border-border px-5 py-3"
              >
                Сменить пароль
              </button>
              <button className="rounded-xl border border-border px-5 py-3">
                Управление сессиями
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Организация</h2>
          <div className="space-y-4">
            <input
              placeholder="Название организации"
              className="h-12 w-full rounded-xl border border-border bg-background px-4"
            />
            <button className="rounded-xl bg-primary px-5 py-3 text-primary-foreground">
              Сохранить изменения
            </button>
          </div>
        </div>

        {isPlatformAdmin && (
          <div className="rounded-2xl border border-primary/40 bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Платформенная админка</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Вы — платформенный администратор. Видны все организации сервиса, можно вручную выдавать бесплатный доступ.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="rounded-xl border border-primary px-5 py-3 text-primary"
            >
              Открыть админ-панель
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
    }
