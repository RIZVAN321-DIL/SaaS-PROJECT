'use client';

import { useMemo } from 'react';

import { AppShell } from '@/components/layout/app-shell';

export default function CalendarPage() {
  const days = useMemo(() => {
    const date = new Date();

    const year =
      date.getFullYear();

    const month =
      date.getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1,
      ).getDay();

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0,
      ).getDate();

    const result: (
      | number
      | null
    )[] = [];

    const offset =
      firstDay === 0
        ? 6
        : firstDay - 1;

    for (
      let i = 0;
      i < offset;
      i++
    ) {
      result.push(null);
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      result.push(day);
    }

    return result;
  }, []);

  const monthName =
    new Date().toLocaleString(
      'en-US',
      {
        month: 'long',
        year: 'numeric',
      },
    );

  const weekDays = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ];

  const today =
    new Date().getDate();

  return (
    <AppShell>
      <div className="space-y-6">
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h1 className="text-3xl font-bold">
              Calendar
            </h1>

            <p className="text-muted-foreground">
              Deadlines, hearings and
              appointments
            </p>
          </div>

          <button
            className="
              rounded-xl
              bg-primary
              px-5
              py-3
              text-sm
              font-medium
              text-primary-foreground
            "
          >
            Add Event
          </button>
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
          <div
            className="
              mb-6
              flex
              items-center
              justify-between
            "
          >
            <h2 className="text-xl font-semibold">
              {monthName}
            </h2>

            <div
              className="
                rounded-lg
                border
                border-border
                px-3
                py-2
                text-sm
              "
            >
              Today
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {weekDays.map(
              (day) => (
                <div
                  key={day}
                  className="
                    py-3
                    text-center
                    text-sm
                    font-medium
                    text-muted-foreground
                  "
                >
                  {day}
                </div>
              ),
            )}

            {days.map(
              (
                day,
                index,
              ) => (
                <div
                  key={index}
                  className={`
                    flex
                    h-28
                    items-start
                    justify-end
                    rounded-xl
                    border
                    border-border
                    p-3
                    ${
                      day === null
                        ? 'border-transparent bg-transparent'
                        : 'bg-background'
                    }
                    ${
                      day === today
                        ? 'ring-2 ring-primary'
                        : ''
                    }
                  `}
                >
                  {day && (
                    <span className="text-sm font-medium">
                      {day}
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div
            className="
              rounded-2xl
              border
              border-border
              bg-card
              p-5
            "
          >
            <div className="text-sm text-muted-foreground">
              Upcoming Hearings
            </div>

            <div className="mt-3 text-3xl font-bold">
              0
            </div>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-border
              bg-card
              p-5
            "
          >
            <div className="text-sm text-muted-foreground">
              Deadlines
            </div>

            <div className="mt-3 text-3xl font-bold">
              0
            </div>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-border
              bg-card
              p-5
            "
          >
            <div className="text-sm text-muted-foreground">
              Meetings
            </div>

            <div className="mt-3 text-3xl font-bold">
              0
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
          }
