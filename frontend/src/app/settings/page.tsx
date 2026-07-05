'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Users,
  CreditCard,
  Shield,
  Building2,
  ExternalLink,
  KeyRound,
  Lock,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { authApi, organizationsApi } from '@/lib/api';
import { getAccessToken, getUser } from '@/lib/auth';
import { toast } from '@/lib/toast';

export default function SettingsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(true);
  const [togglingTwoFactor, setTogglingTwoFactor] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [hideAdminSections, setHideAdminSections] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      const token = getAccessToken();
      if (!token || !currentUser || currentUser.role !== 'LAWYER') return;
      try {
        const settings = await organizationsApi.getPermissions(currentUser.organizationId, token);
        setHideAdminSections(Boolean(settings.hideAdminSectionsFromLawyers));
      } catch {
        // тихо игнорируем — по умолчанию разделы остаются видимыми
      }
    }
    loadPermissions();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) setTheme(saved);
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
    if (value === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
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
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Настройки</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Системные настройки и персонализация
          </p>
        </div>

        {/* Внешний вид */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Sun size={15} /> Внешний вид
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">Выберите тему оформления</p>
          <div className="flex gap-2">
            <button
              onClick={() => changeTheme('light')}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                theme === 'light'
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Sun size={14} /> Светлая
            </button>
            <button
              onClick={() => changeTheme('dark')}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                theme === 'dark'
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Moon size={14} /> Тёмная
            </button>
          </div>
        </div>

        {/* Команда */}
        {!hideAdminSections && (
          <div
            onClick={() => router.push('/settings/team')}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
          >
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Users size={15} /> Команда
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Управляйте сотрудниками, приглашайте юристов и ассистентов
              </p>
            </div>
            <ExternalLink size={15} className="shrink-0 text-muted-foreground" />
          </div>
        )}

        {/* Права доступа */}
        {!hideAdminSections && (
          <div
            onClick={() => router.push('/settings/permissions')}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
          >
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Lock size={15} /> Права доступа
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Кто и что видит и может удалять в организации
              </p>
            </div>
            <ExternalLink size={15} className="shrink-0 text-muted-foreground" />
          </div>
        )}

        {/* Шаблоны документов */}
        {!hideAdminSections && (
          <div
            onClick={() => router.push('/settings/templates')}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
          >
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <FileText size={15} /> Шаблоны документов
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Договоры, доверенности и другие документы с автозаполнением
              </p>
            </div>
            <ExternalLink size={15} className="shrink-0 text-muted-foreground" />
          </div>
        )}

        {/* Настраиваемые поля — только владелец организации */}
        {currentUser?.role === 'OWNER' && (
          <div
            onClick={() => router.push('/settings/custom-fields')}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
          >
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal size={15} /> Настраиваемые поля
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Свои поля для клиента и дела под вашу сферу — без программиста
              </p>
            </div>
            <ExternalLink size={15} className="shrink-0 text-muted-foreground" />
          </div>
        )}

        {/* Тариф */}
        <div
          onClick={() => router.push('/settings/billing')}
          className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
        >
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard size={15} /> Тариф и оплата
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Текущий тариф, оформление и управление подпиской
            </p>
          </div>
          <ExternalLink size={15} className="shrink-0 text-muted-foreground" />
        </div>

        {/* Безопасность */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Shield size={15} /> Безопасность
          </h2>
          <div className="space-y-3">
            {/* 2FA тоггл */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Двухфакторная аутентификация</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  При входе потребуется код из email
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={twoFactorEnabled}
                disabled={loadingTwoFactor || togglingTwoFactor}
                onClick={toggleTwoFactor}
                className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
                  twoFactorEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Смена пароля */}
            <div
              onClick={() => router.push('/settings/change-password')}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border/60 px-4 py-3 transition hover:border-primary/50"
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound size={14} /> Сменить пароль
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Введите текущий пароль и задайте новый
                </p>
              </div>
              <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Организация */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Building2 size={15} /> Организация
          </h2>
          <div className="flex gap-3">
            <input
              placeholder="Название организации"
              className="h-10 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
            <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              Сохранить
            </button>
          </div>
        </div>

        {/* Платформенная админка */}
        {isPlatformAdmin && (
          <div
            onClick={() => router.push('/admin')}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-primary/40 bg-primary/5 p-5 transition hover:border-primary"
          >
            <div>
              <h2 className="text-sm font-semibold text-primary">Платформенная админка</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Все организации платформы, ручная выдача доступа
              </p>
            </div>
            <ExternalLink size={15} className="shrink-0 text-primary" />
          </div>
        )}
      </div>
    </AppShell>
  );
      }
