'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Users, LayoutDashboard, ArrowRight } from 'lucide-react';
import { getUser } from '@/lib/auth';

export default function OnboardingPage() {
  const router = useRouter();
  const user = getUser();

  const steps = [
    {
      icon: Briefcase,
      title: 'Создайте первое дело',
      description:
        'Дело — это центр CRM: внутри него клиент, документы, задачи и история в одном месте.',
      action: () => router.push('/cases'),
      cta: 'Перейти к делам',
    },
    {
      icon: Users,
      title: 'Пригласите коллег',
      description:
        'Добавьте юристов и ассистентов вашей фирмы — у каждого будет своя роль и доступ.',
      action: () => router.push('/settings/team'),
      cta: 'Управление командой',
    },
    {
      icon: LayoutDashboard,
      title: 'Изучите панель управления',
      description:
        'Здесь вы увидите воронку дел, загрузку юристов и ближайшие задачи.',
      action: () => router.push('/dashboard'),
      cta: 'Открыть панель',
    },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold">
            Добро пожаловать{user?.email ? `, ${user.email}` : ''}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Аккаунт создан. Вот с чего стоит начать работу в системе.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.title}
                type="button"
                onClick={step.action}
                className="flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-6 text-left transition hover:border-primary"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold">{step.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-center text-sm font-medium text-primary">
                  {step.cta}
                  <ArrowRight size={16} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Пропустить и перейти в панель управления →
          </button>
        </div>
      </div>
    </main>
  );
}
