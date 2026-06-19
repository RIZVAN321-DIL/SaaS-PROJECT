// Файл 4: frontend/src/components/layout/header.tsx
'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, Search } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getUser, getAccessToken, clearAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { navigation } from '@/components/layout/sidebar';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const user = getUser();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const roleLabels: Record<string, string> = {
    OWNER: 'Владелец',
    ADMIN: 'Администратор',
    LAWYER: 'Юрист',
    ASSISTANT: 'Помощник',
  };

  const currentPage = navigation.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const token = getAccessToken();
      if (token) {
        await authApi.logout(token);
      }
    } catch {
      // даже если запрос на бэкенд не прошёл, локальную сессию всё равно завершаем
    } finally {
      clearAuth();
      router.push('/login');
    }
  }

  return (
    <header
      className="
        flex
        h-20
        items-center
        justify-between
        border-b
        border-border
        bg-background/80
        px-4
        md:px-6
        backdrop-blur
        gap-4
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Открыть меню"
          onClick={onMenuClick}
          className="md:hidden shrink-0 rounded-lg p-2 hover:bg-accent"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h2
            className="
              text-xl
              md:text-2xl
              font-bold
              truncate
            "
          >
            {currentPage?.label ?? 'Юридическая CRM'}
          </h2>

          <p
            className="
              hidden
              sm:block
              text-sm
              text-muted-foreground
              truncate
            "
          >
            Платформа для управления юридической деятельностью
          </p>
        </div>
      </div>

      <div
        className="
          flex
          items-center
          gap-2
          md:gap-4
          shrink-0
        "
      >
        <button
          type="button"
          onClick={onSearchClick}
          title="Быстрый поиск (Cmd+K)"
          className="
            hidden
            sm:flex
            h-11
            items-center
            gap-2
            rounded-xl
            border
            border-border
            px-3
            text-sm
            text-muted-foreground
            transition
            hover:bg-accent
          "
        >
          <Search size={16} />
          <span>Поиск...</span>
          <kbd className="ml-2 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={onSearchClick}
          title="Поиск"
          aria-label="Поиск"
          className="
            flex
            sm:hidden
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            border
            border-border
            hover:bg-accent
            transition
          "
        >
          <Search size={18} />
        </button>

        <ThemeToggle />

        <NotificationBell />

        <div
          className="
            hidden
            sm:flex
            flex-col
            items-end
          "
        >
          <span
            className="
              text-sm
              font-medium
            "
          >
            {user?.email ?? 'Пользователь'}
          </span>

          <span
            className="
              text-xs
              text-muted-foreground
            "
          >
            {user?.role
              ? roleLabels[user.role] ?? user.role
              : 'Юрист'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Выйти"
          aria-label="Выйти"
          className="
            flex
            items-center
            justify-center
            rounded-xl
            border
            border-border
            h-11
            w-11
            hover:bg-accent
            transition
            disabled:opacity-50
          "
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
