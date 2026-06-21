'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/search/command-palette';
import { QuickCreateMenu } from '@/components/layout/quick-create-menu';

interface AppShellProps {
  children: ReactNode;
  /** Опциональная правая колонка (290px, видна от xl) */
  rightPanel?: ReactNode;
}

export function AppShell({ children, rightPanel }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Cmd+K / Ctrl+K — быстрый поиск
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
    <div className="flex min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onMenuClick={() => setMobileNavOpen(true)}
          onSearchClick={() => setCommandPaletteOpen(true)}
          onQuickCreateClick={() => setQuickCreateOpen((v) => !v)}
        />

        <div className="flex flex-1 min-w-0 overflow-hidden">
          <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>

          {rightPanel && (
            <aside className="hidden xl:block w-[290px] shrink-0 overflow-y-auto border-l border-border bg-card p-4">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>

      <QuickCreateMenu
        open={quickCreateOpen}
        onToggle={() => setQuickCreateOpen((v) => !v)}
        onClose={() => setQuickCreateOpen(false)}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
