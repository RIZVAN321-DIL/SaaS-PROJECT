'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { billingApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  key: string;
  name: string;
  description?: string;
  priceMonthly: number;
  currency: string;
  maxUsers?: number | null;
}

interface Subscription {
  id: string;
  planId?: string | null;
  plan?: Plan | null;
  status: string;
  stripeCustomerId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  manualOverride: boolean;
  overrideReason?: string | null;
  overrideExpiresAt?: string | null;
  isActive: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Пробный период',
  active: 'Активна',
  past_due: 'Просрочена оплата',
  canceled: 'Отменена',
  incomplete: 'Не завершена',
};

function formatPrice(plan: Plan) {
  const amount = (plan.priceMonthly / 100).toFixed(2);
  return `${amount} ${plan.currency.toUpperCase()} / мес`;
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  async function loadData() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const [plansData, subscriptionData] = await Promise.all([
        billingApi.getPlans(),
        billingApi.getSubscription(token),
      ]);
      setPlans(plansData as Plan[]);
      setSubscription(subscriptionData as Subscription);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    if (searchParams.get('success') === 'true') {
      toast.success('Подписка оформлена! Обновляем статус...');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Оформление подписки отменено');
    }
  }, []);

  async function handleCheckout(planId: string) {
    const token = getAccessToken();
    if (!token) return;
    setCheckingOutPlanId(planId);
    try {
      const result = (await billingApi.createCheckout(planId, token)) as { url: string };
      window.location.href = result.url;
    } catch {
      toast.error('Не удалось перейти к оплате');
      setCheckingOutPlanId(null);
    }
  }

  async function handlePortal() {
    const token = getAccessToken();
    if (!token) return;
    setOpeningPortal(true);
    try {
      const result = (await billingApi.createPortal(token)) as { url: string };
      window.location.href = result.url;
    } catch {
      toast.error('Не удалось открыть управление подпиской');
      setOpeningPortal(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Настройки
        </button>

        <div>
          <h1 className="text-3xl font-bold">Тариф и оплата</h1>
          <p className="text-muted-foreground">Управление подпиской организации</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Загрузка...
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Текущий статус</h2>
              {subscription?.manualOverride ? (
                <div className="space-y-2">
                  <span className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    Бесплатный доступ предоставлен администратором
                  </span>
                  {subscription.overrideReason && (
                    <p className="text-sm text-muted-foreground">{subscription.overrideReason}</p>
                  )}
                  {subscription.overrideExpiresAt && (
                    <p className="text-sm text-muted-foreground">
                      Действует до{' '}
                      {new Date(subscription.overrideExpiresAt).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-lg px-3 py-1 text-sm font-medium ${
                      subscription?.isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {subscription
                      ? STATUS_LABELS[subscription.status] ?? subscription.status
                      : 'Нет подписки'}
                  </span>
                  {subscription?.plan && (
                    <span className="text-sm text-muted-foreground">
                      Тариф: {subscription.plan.name}
                    </span>
                  )}
                  {subscription?.currentPeriodEnd && (
                    <span className="text-sm text-muted-foreground">
                      {subscription.cancelAtPeriodEnd ? 'Действует до' : 'Продление'}{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              )}
              {subscription?.stripeCustomerId && (
                <Button
                  variant="secondary"
                  onClick={handlePortal}
                  loading={openingPortal}
                  className="mt-4"
                >
                  Управление подпиской
                </Button>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold">Доступные тарифы</h2>
              {plans.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                  Тарифы пока не настроены
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {plans.map((plan) => {
                    const isCurrent = subscription?.planId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`flex flex-col rounded-2xl border bg-card p-6 ${
                          isCurrent ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <p className="mt-1 text-2xl font-bold">{formatPrice(plan)}</p>
                        {plan.description && (
                          <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                        )}
                        <p className="mt-2 text-sm text-muted-foreground">
                          {plan.maxUsers
                            ? `До ${plan.maxUsers} пользователей`
                            : 'Без ограничения по пользователям'}
                        </p>
                        <div className="flex-1" />
                        {isCurrent ? (
                          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-medium text-primary">
                            <Check size={16} />
                            Текущий тариф
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleCheckout(plan.id)}
                            loading={checkingOutPlanId === plan.id}
                            className="mt-6 w-full"
                          >
                            Подключить
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="text-center text-muted-foreground">Загрузка...</div>
        </AppShell>
      }
    >
      <BillingContent />
    </Suspense>
  );
    }
