'use client';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getUser } from '@/lib/auth';

export function Header() {
  const user = getUser();

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
          CRM Dashboard
        </h2>

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          Legal Operations Platform
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
            {user?.email ??
              'User'}
          </span>

          <span
            className="
              text-xs
              text-muted-foreground
            "
          >
            {user?.role ??
              'LAWYER'}
          </span>
        </div>
      </div>
    </header>
  );
}
