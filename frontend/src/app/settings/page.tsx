'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';

export default function SettingsPage() {
  const [theme, setTheme] =
    useState<'light' | 'dark'>(
      'dark',
    );

  useEffect(() => {
    const savedTheme =
      localStorage.getItem(
        'theme',
      ) as
        | 'light'
        | 'dark'
        | null;

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  function changeTheme(
    value: 'light' | 'dark',
  ) {
    setTheme(value);

    localStorage.setItem(
      'theme',
      value,
    );

    if (value === 'dark') {
      document.documentElement.classList.add(
        'dark',
      );
    } else {
      document.documentElement.classList.remove(
        'dark',
      );
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">
            Settings
          </h1>

          <p className="text-muted-foreground">
            System preferences and
            personalization
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-card
            p-6
          "
        >
          <h2 className="mb-4 text-lg font-semibold">
            Appearance
          </h2>

          <div className="flex gap-4">
            <button
              onClick={() =>
                changeTheme(
                  'light',
                )
              }
              className={`
                rounded-xl
                border
                px-5
                py-3
                transition
                ${
                  theme ===
                  'light'
                    ? 'border-primary'
                    : 'border-border'
                }
              `}
            >
              Light Theme
            </button>

            <button
              onClick={() =>
                changeTheme(
                  'dark',
                )
              }
              className={`
                rounded-xl
                border
                px-5
                py-3
                transition
                ${
                  theme ===
                  'dark'
                    ? 'border-primary'
                    : 'border-border'
                }
              `}
            >
              Dark Theme
            </button>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-card
            p-6
          "
        >
          <h2 className="mb-4 text-lg font-semibold">
            Security
          </h2>

          <div className="space-y-4">
            <button
              className="
                rounded-xl
                border
                border-border
                px-5
                py-3
              "
            >
              Change Password
            </button>

            <button
              className="
                rounded-xl
                border
                border-border
                px-5
                py-3
              "
            >
              Manage Sessions
            </button>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-card
            p-6
          "
        >
          <h2 className="mb-4 text-lg font-semibold">
            Organization
          </h2>

          <div className="space-y-4">
            <input
              placeholder="Organization Name"
              className="
                h-12
                w-full
                rounded-xl
                border
                border-border
                bg-background
                px-4
              "
            />

            <button
              className="
                rounded-xl
                bg-primary
                px-5
                py-3
                text-primary-foreground
              "
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
