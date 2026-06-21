'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="h-9 w-9 rounded-xl border border-border" />;
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <button
      type="button"
      onClick={() =>
        setTheme(currentTheme === 'dark' ? 'light' : 'dark')
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition-all hover:scale-105"
      aria-label="Toggle theme"
    >
      {currentTheme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
