'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    label: 'Панель управления',
    href: '/dashboard',
  },
  {
    label: 'Клиенты',
    href: '/clients',
  },
  {
    label: 'Дела',
    href: '/cases',
  },
  {
    label: 'Типы дел',
    href: '/case-types',
  },
  {
    label: 'Стадии',
    href: '/stages',
  },
  {
    label: 'Воронка дел',
    href: '/pipeline',
  },
  {
    label: 'Задачи',
    href: '/tasks',
  },
  {
    label: 'Документы',
    href: '/documents',
  },
  {
    label: 'Календарь',
    href: '/calendar',
  },
  {
    label: 'Журнал аудита',
    href: '/audit',
  },
  {
    label: 'Настройки',
    href: '/settings',
  },
];

export function Sidebar() {
  const pathname =
    usePathname();

  return (
    <aside
      className="
        hidden
        md:flex
        md:w-72
        md:flex-col
        border-r
        border-border
        bg-card
      "
    >
      <div
        className="
          flex
          h-20
          items-center
          px-6
          border-b
          border-border
        "
      >
        <div>
          <h1
            className="
              text-xl
              font-bold
            "
          >
            Юридическая CRM
          </h1>

          <p
            className="
              text-sm
              text-muted-foreground
            "
          >
            Корпоративная версия
          </p>
        </div>
      </div>

      <nav
        className="
          flex-1
          p-4
          space-y-2
        "
      >
        {navigation.map(
          (item) => {
            const active =
              pathname ===
                item.href ||
              pathname.startsWith(
                `${item.href}/`,
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  items-center
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-medium
                  transition-all
                  ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          },
        )}
      </nav>
    </aside>
  );
}
