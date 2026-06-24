'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Users, LayoutDashboard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getUser } from '@/lib/auth';

const steps = [
  {
    icon: Briefcase,
    title: 'Создайте первое дело',
    description: 'Дело — центр CRM: внутри него клиент, документы, задачи и история в одном месте.',
    href: '/cases',
    cta: 'Перейти к делам',
  },
  {
    icon: Users,
    title: 'Пригласите коллег',
    description: 'Добавьте юристов и ассистентов — у каждого будет своя роль и уровень доступа.',
    href: '/settings/team',
    cta: 'Управление командой',
  },
  {
    icon: LayoutDashboard,
    title: 'Изучите панель управления',
    description: 'Воронка дел, загрузка юристов и ближайшие задачи — всё на одном экране.',
    href: '/dashboard',
    cta: 'Открыть панель',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Добро пожаловать{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Аккаунт создан. Вот с чего стоит начать работу.</p>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <button
                key={step.href}
                type="button"
                onClick={() => router.push(step.href)}
                className="flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/50 hover:shadow-sm"
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={20} className="text-primary" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{idx + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{step.title}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-center text-xs font-medium text-primary">{step.cta}<ArrowRight size={13} /></div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button type="button" onClick={() => router.push('/dashboard')} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            Пропустить и перейти в панель →
          </button>
        </div>
      </div>
    </main>
  );
}
