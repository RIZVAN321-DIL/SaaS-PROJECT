'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccessToken } from '@/lib/auth';
import {
  ShieldCheck,
  KanbanSquare,
  Users,
  FileLock2,
  Clock,
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: KanbanSquare,
    title: 'Управление делами',
    description:
      'Канбан-доска по стадиям дела с настраиваемыми этапами, автоматическим порядком и историей изменений.',
  },
  {
    icon: Users,
    title: 'Клиенты и задачи',
    description:
      'Единая карточка клиента со всеми делами, задачами и документами. Ничего не теряется между сотрудниками.',
  },
  {
    icon: ShieldCheck,
    title: 'Гибкие права доступа',
    description:
      'Настраиваемые роли: кто видит какие дела, кто может редактировать, а кто — только просматривать.',
  },
  {
    icon: FileLock2,
    title: 'Документы под защитой',
    description:
      'Хранение файлов с шифрованием AES-256-GCM и контролем доступа на уровне организации.',
  },
  {
    icon: Clock,
    title: 'Календарь и сроки',
    description:
      'Все процессуальные сроки и встречи в одном календаре с напоминаниями — ничего не пропустите.',
  },
  {
    icon: Sparkles,
    title: 'Журнал аудита',
    description:
      'Полная история действий в системе — кто, что и когда изменил. Прозрачность для всей команды.',
  },
];

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '2 900 ₽',
    period: '/ мес',
    description: 'Для небольшой практики',
    features: ['До 3 пользователей', 'Управление делами и клиентами', 'Базовый календарь', 'Email-поддержка'],
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '7 900 ₽',
    period: '/ мес',
    description: 'Для растущей фирмы',
    features: [
      'До 10 пользователей',
      'Настраиваемые права доступа',
      'Журнал аудита',
      'Приоритетная поддержка',
    ],
    highlighted: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '19 900 ₽',
    period: '/ мес',
    description: 'Без ограничений по команде',
    features: [
      'Неограниченное число пользователей',
      'Персональный менеджер',
      'Расширенная безопасность',
      'SLA и приоритетная техподдержка',
    ],
    highlighted: false,
  },
];

function MockDashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['Новое', 'В работе', 'Завершено'].map((col, i) => (
          <div key={col} className="rounded-xl bg-muted/60 p-2.5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{col}</p>
            <div className="space-y-2">
              {Array.from({ length: i === 1 ? 3 : 2 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-lg border border-border bg-card p-2.5 shadow-sm"
                >
                  <div className="mb-1.5 h-2 w-3/4 rounded-full bg-primary/30" />
                  <div className="h-2 w-1/2 rounded-full bg-muted-foreground/20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      router.push('/dashboard');
    } else {
      setCheckedAuth(true);
    }
  }, [router]);

  if (!checkedAuth) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-mark.svg" alt="CaseFlow" className="h-9 w-9" />
            <span className="text-lg font-bold">CaseFlow</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Возможности
            </a>
            <a href="#security" className="hover:text-foreground">
              Безопасность
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Тарифы
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Начать бесплатно
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center gap-10 py-16 text-center sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Юридическая CRM нового поколения
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Все дела вашей фирмы —{' '}
          <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
            в одном потоке
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          CaseFlow объединяет дела, клиентов, задачи, документы и сроки в единой системе
          с гибкими правами доступа — чтобы ваша команда работала быстрее и ничего не теряла.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Попробовать бесплатно
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Смотреть тарифы
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Без банковской карты · Отмена в любой момент
        </p>
        <MockDashboardPreview />
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/40 py-20">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Всё, что нужно юридической фирме</h2>
            <p className="mt-3 text-muted-foreground">
              Один инструмент вместо таблиц, чатов и разрозненных папок с документами.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-soft"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-border py-20">
        <div className="container grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Конфиденциальность клиентов — на первом месте
            </h2>
            <p className="mt-4 text-muted-foreground">
              Документы дел — самая чувствительная информация в вашей практике. CaseFlow
              шифрует их по стандарту AES-256-GCM, ведёт полный журнал аудита действий и
              позволяет точно настроить, кто из сотрудников что видит.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Шифрование документов AES-256-GCM',
                'Двухфакторная аутентификация',
                'Журнал аудита всех действий',
                'Ролевой доступ к делам и задачам',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-semibold">Данные под защитой</p>
                <p className="text-xs text-muted-foreground">AES-256-GCM шифрование</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {['Договор_подряда.pdf', 'Исковое_заявление.docx', 'Доверенность.pdf'].map(
                (name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  >
                    <span className="text-muted-foreground">{name}</span>
                    <Lock className="h-3.5 w-3.5 text-primary" />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-card/40 py-20">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Прозрачные тарифы</h2>
            <p className="mt-3 text-muted-foreground">
              Выберите план под размер вашей команды. Можно сменить в любой момент.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-primary bg-card shadow-soft ring-1 ring-primary'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Популярный выбор
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 flex h-11 items-center justify-center rounded-xl text-sm font-medium transition ${
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'border border-border bg-background hover:bg-accent'
                  }`}
                >
                  Выбрать {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-20">
        <div className="container flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">
            Готовы навести порядок в делах фирмы?
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Регистрация занимает меньше двух минут. Первые 14 дней — бесплатно.
          </p>
          <Link
            href="/register"
            className="flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Начать бесплатно
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo-mark.svg" alt="CaseFlow" className="h-6 w-6" />
            <span>CaseFlow</span>
          </div>
          <p>© {new Date().getFullYear()} CaseFlow. Все права защищены.</p>
        </div>
      </footer>
    </main>
  );
}
