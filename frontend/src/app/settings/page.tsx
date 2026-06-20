'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as
      | 'light'
      | 'dark'
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
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
          <h2 className="mb-4 text-lg font-semibold">Безопасность</h2>
          <div className="space-y-4">
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
      </div>
    </AppShell>
  );
}
