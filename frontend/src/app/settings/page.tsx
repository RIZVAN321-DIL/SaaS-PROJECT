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
  Gift,
  Copy,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { authApi, organizationsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(true);
  const [togglingTwoFactor, setTogglingTwoFactor] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    async function loadReferral() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = (await organizationsApi.getReferral(token)) as {
          referralCode: string;
          referralCount: number;
        };
        setReferralCode(data.referralCode);
        setReferralCount(data.referralCount);
      } catch {
        // silently fail
      }
    }
    loadReferral();
  }, []);

  function copyReferralCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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

            {/* п.27: Смена пароля — отдельная страница для авторизованного пользователя */}
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

        {/* Реферальная программа */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Gift size={15} /> Реферальная программа
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Пригласите коллег и получайте бесплатные месяцы для всей команды
          </p>

          {referralCode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-11 flex-1 items-center rounded-xl border border-border bg-background px-4 font-mono text-sm tracking-widest">
                  {referralCode}
                </div>
                <button
                  type="button"
                  onClick={copyReferralCode}
                  className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium transition hover:border-primary/50"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
              </div>

              <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Организаций приглашено</span>
                  <span className="font-semibold">{referralCount}</span>
                </div>
                {referralCount > 0 && (
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Заработано бесплатных месяцев</span>
                    <span className="font-semibold text-emerald-600">{referralCount}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                За каждую новую организацию, зарегистрировавшуюся с вашим кодом, вы получаете +1 бесплатный месяц. Новая организация также получает 1 месяц бесплатно.
              </p>
            </div>
          ) : (
            <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
          )}
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
