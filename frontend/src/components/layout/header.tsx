'use client';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getUser } from '@/lib/auth';

export function Header() {
  const user = getUser();

  const roleLabels: Record<string, string> = {
    OWNER: 'Владелец',
    ADMIN: 'Администратор',
    LAWYER: 'Юрист',
    ASSISTANT: 'Помощник',
  };

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
        px-6
        backdrop-blur
      "
    >
      <div>
        <h2
          className="
            text-2xl
            font-bold
          "
        >
          Панель управления
        </h2>

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          Платформа для управления юридической деятельностью
        </p>
      </div>

      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        <ThemeToggle />

        <div
          className="
            flex
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
      </div>
    </header>
  );
}
