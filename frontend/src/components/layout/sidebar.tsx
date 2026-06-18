// frontend/src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

export const navigation = [
  { label: 'Панель управления', href: '/dashboard' },
  { label: 'Клиенты', href: '/clients' },
  { label: 'Дела', href: '/cases' },
  { label: 'Типы дел', href: '/case-types' },
  { label: 'Стадии', href: '/stages' },
  { label: 'Воронка дел', href: '/pipeline' },
  { label: 'Задачи', href: '/tasks' },
  { label: 'Документы', href: '/documents' },
  { label: 'Календарь', href: '/calendar' },
  { label: 'Журнал аудита', href: '/audit' },
  { label: 'Настройки', href: '/settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarBrand() {
  return (
    <div>
      <h1 className="text-xl font-bold">Юридическая CRM</h1>
      <p className="text-sm text-muted-foreground">Корпоративная версия</p>
    </div>
  );
}

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      {navigation.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex md:w-72 md:flex-col border-r border-border bg-card">
        <div className="flex h-20 items-center px-6 border-b border-border">
          <SidebarBrand />
        </div>
        <SidebarNav />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />

          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 h-20">
              <SidebarBrand />
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={onMobileClose}
                className="rounded-lg p-2 hover:bg-accent shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <SidebarNav onItemClick={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
