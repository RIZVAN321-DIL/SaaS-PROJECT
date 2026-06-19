// Файл 5: frontend/src/components/layout/app-shell.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/search/command-palette';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Глобальный шорткат Cmd+K / Ctrl+K — открывает быстрый поиск с любой страницы
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="
        flex
        min-h-screen
        bg-background
      "
    >
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div
        className="
          flex
          flex-1
          flex-col
          min-w-0
        "
      >
        <Header
          onMenuClick={() => setMobileNavOpen(true)}
          onSearchClick={() => setCommandPaletteOpen(true)}
        />

        <main
          className="
            flex-1
            p-4
            md:p-6
            lg:p-8
            overflow-x-hidden
          "
        >
          {children}
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
