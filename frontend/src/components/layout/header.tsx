'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Search, Plus } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getUser, getAccessToken, clearAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onQuickCreateClick?: () => void;
}

export function Header({
  onMenuClick,
  onSearchClick,
  onQuickCreateClick,
}: HeaderProps) {
  const user = getUser();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const initial = (user?.email ?? '?').charAt(0).toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const token = getAccessToken();
      if (token) {
        await authApi.logout(token);
      }
    } catch {
      // завершаем сессию даже при ошибке запроса
    } finally {
      clearAuth();
      router.push('/login');
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-5 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Открыть меню"
          onClick={onMenuClick}
          className="md:hidden shrink-0 rounded-lg p-2 hover:bg-accent"
        >
          <Menu size={20} />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src="/logo-mark.svg" alt="CaseFlow" className="h-8 w-8" />
          <span className="hidden sm:block text-lg font-extrabold">
            Case<span className="text-primary">Flow</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <button
          type="button"
          onClick={onSearchClick}
          title="Быстрый поиск (Cmd+K)"
          aria-label="Поиск"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent"
        >
          <Search size={16} />
        </button>

        <ThemeToggle />

        <NotificationBell />

        <button
          type="button"
          onClick={onQuickCreateClick}
          title="Быстрое создание"
          aria-label="Быстрое создание"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border font-bold text-primary transition hover:bg-accent"
        >
          <Plus size={18} />
        </button>

        <Link
          href="/settings"
          title={user?.email ?? 'Настройки'}
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {initial}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Выйти"
          aria-label="Выйти"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:bg-accent disabled:opacity-50"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
