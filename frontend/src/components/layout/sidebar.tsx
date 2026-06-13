'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Clients',
    href: '/clients',
  },
  {
    label: 'Cases',
    href: '/cases',
  },
  {
    label: 'Pipeline',
    href: '/pipeline',
  },
  {
    label: 'Tasks',
    href: '/tasks',
  },
  {
    label: 'Documents',
    href: '/documents',
  },
  {
    label: 'Calendar',
    href: '/calendar',
  },
  {
    label: 'Audit',
    href: '/audit',
  },
  {
    label: 'Settings',
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
            Legal CRM
          </h1>

          <p
            className="
              text-sm
              text-muted-foreground
            "
          >
            Enterprise Edition
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
