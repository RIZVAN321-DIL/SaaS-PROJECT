import { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div
      className="
        flex
        min-h-screen
        bg-background
      "
    >
      <Sidebar />

      <div
        className="
          flex
          flex-1
          flex-col
        "
      >
        <Header />

        <main
          className="
            flex-1
            p-6
            lg:p-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
