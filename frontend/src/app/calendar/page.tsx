'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { calendarApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CalendarEventForm } from '@/components/forms/calendar-event-form';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  caseId?: string;
  case?: { id: string; title: string };
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MAX_DOTS_PER_DAY = 3;

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarPage() {
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // =========================
  // FIX: Hydration Error #425
  // new Date() на сервере и клиенте может вернуть разные значения —
  // React видит расхождение и крашится с ошибкой #425.
  // Решение: инициализировать cursor и selectedDay как null,
  // выставлять в useEffect (только на клиенте, после монтирования).
  // =========================
  const [cursor, setCursor] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const now = new Date();
    setCursor(now);
    setSelectedDay(now);
    setMounted(true);
  }, []);

  async function loadEvents() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await calendarApi.getAll(token);
      setEvents(data as EventItem[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const year = cursor?.getFullYear() ?? new Date().getFullYear();
  const month = cursor?.getMonth() ?? new Date().getMonth();
  const monthLabel = cursor
    ? cursor.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
    : '';

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const result: (number | null)[] = [];
    for (let i = 0; i < offset; i++) result.push(null);
    for (let day = 1; day <= daysInMonth; day++) result.push(day);
    return result;
  }, [year, month]);

  function eventsOnDay(day: number) {
    const target = new Date(year, month, day);
    return events.filter((e) => sameDay(new Date(e.date), target));
  }

  // today вычисляем только на клиенте — не используем при SSR
  const today = mounted ? new Date() : null;

  const selectedDayEvents = selectedDay
    ? events
        .filter((e) => sameDay(new Date(e.date), selectedDay))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const eventsThisMonth = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const next7Days = today
    ? events.filter((e) => {
        const d = new Date(e.date);
        const in7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return d >= today && d <= in7;
      })
    : [];

  const withoutCase = events.filter((e) => !e.caseId);

  async function handleDelete(id: string) {
    const token = getAccessToken();
    if (!token) return;
    if (!confirm('Удалить это событие?')) return;
    try {
      await calendarApi.remove(id, token);
      toast.success('Событие удалено');
      loadEvents();
    } catch {
      toast.error('Не удалось удалить событие');
    }
  }

  function goToMonth(delta: number) {
    if (!cursor) return;
    setCursor(new Date(year, month + delta, 1));
  }

  function goToToday() {
    const now = new Date();
    setCursor(now);
    setSelectedDay(now);
  }

  // Пока не смонтировались — показываем скелет чтобы SSR и клиент совпадали
  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Календарь</h1>
            <p className="text-muted-foreground">Дедлайны, заседания и встречи</p>
          </div>
          <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Календарь</h1>
            <p className="text-muted-foreground">Дедлайны, заседания и встречи</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> Добавить событие
          </Button>
        </div>

        <Modal open={showForm} onClose={() => setShowForm(false)} title="Новое событие">
          <CalendarEventForm
            onSuccess={() => {
              setShowForm(false);
              toast.success('Событие создано');
              loadEvents();
            }}
          />
        </Modal>

        {/* ===== СЕТКА КАЛЕНДАРЯ ===== */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                Сегодня
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent"
                aria-label="Следующий месяц"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-muted-foreground md:text-sm"
              >
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              if (day === null) return <div key={index} className="h-20 md:h-28" />;
              const dayEvents = eventsOnDay(day);
              const dayDate = new Date(year, month, day);
              const isToday = today ? sameDay(dayDate, today) : false;
              const isSelected = selectedDay ? sameDay(dayDate, selectedDay) : false;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedDay(dayDate)}
                  className={`flex h-20 flex-col items-end gap-1 rounded-xl border p-2 text-left transition md:h-28 md:p-3 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-accent'
                  } ${isToday ? 'ring-2 ring-primary' : ''}`}
                >
                  <span className="text-xs font-medium md:text-sm">{day}</span>
                  <div className="flex w-full flex-1 flex-col items-start justify-end gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, MAX_DOTS_PER_DAY).map((e) => (
                      <span
                        key={e.id}
                        className="w-full truncate rounded bg-primary/10 px-1 text-left text-[10px] text-primary"
                      >
                        {e.title}
                      </span>
                    ))}
                    {dayEvents.length > MAX_DOTS_PER_DAY && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - MAX_DOTS_PER_DAY}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== СТАТИСТИКА ===== */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">Событий в этом месяце</div>
            <div className="mt-3 text-3xl font-bold">{eventsThisMonth.length}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">Ближайшие 7 дней</div>
            <div className="mt-3 text-3xl font-bold">{next7Days.length}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">Без привязки к делу</div>
            <div className="mt-3 text-3xl font-bold">{withoutCase.length}</div>
          </div>
        </div>

        {/* ===== СОБЫТИЯ ВЫБРАННОГО ДНЯ ===== */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">
            {selectedDay
              ? selectedDay.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">На этот день событий нет</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{event.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(event.date).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {event.case && (
                        <button
                          type="button"
                          onClick={() => router.push(`/cases/${event.case!.id}`)}
                          className="text-primary hover:underline"
                        >
                          {event.case.title}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id)}
                    className="shrink-0 text-muted-foreground hover:text-red-500"
                    aria-label="Удалить"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
            }
