'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, ChevronLeft, Zap, Users, Gift } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { billingApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';

interface Subscription {
  id: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  manualOverride: boolean;
  overrideReason?: string | null;
  overrideExpiresAt?: string | null;
  pricePerSeat: number;
  quantity: number;
  freeMonthsCredit: number;
  monthlyTotal: number;
  isActive: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Пробный период',
  active: 'Активна',
  past_due: 'Просрочена оплата',
  canceled: 'Отменена',
  incomplete: 'Не завершена',
};

function formatRub(kopecks: number) {
  return `${(kopecks / 100).toLocaleString('ru-RU')} ₽`;
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  async function loadData() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const subscriptionData = await billingApi.getSubscription(token);
      setSubscription(subscriptionData as Subscription);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    if (searchParams.get('success') === 'true') toast.success('Подписка оформлена! Обновляем статус...');
    else if (searchParams.get('canceled') === 'true') toast.info('Оформление подписки отменено');
  }, []);

  async function handleCheckout() {
    const token = getAccessToken();
    if (!token) return;
    setCheckingOut(true);
    try {
      const result = (await billingApi.createCheckout(token)) as { url: string };
      window.location.href = result.url;
    } catch {
      toast.error('Не удалось перейти к оплате');
      setCheckingOut(false);
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
      <div className="space-y-5">
        <button type="button" onClick={() => router.push('/settings')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={14} /> Настройки
        </button>

        <div>
          <h1 className="text-2xl font-bold">Тариф и оплата</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Простая схема: платите только за активных сотрудников</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CreditCard size={15} /> Текущий статус
              </h2>
              {subscription?.manualOverride ? (
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Zap size={11} /> Бесплатный доступ от администратора
                  </span>
                  {subscription.overrideReason && <p className="mt-1 text-sm text-muted-foreground">{subscription.overrideReason}</p>}
                  {subscription.overrideExpiresAt && (
                    <p className="text-xs text-muted-foreground">Действует до {new Date(subscription.overrideExpiresAt).toLocaleDateString('ru-RU')}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${subscription?.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                    {subscription ? STATUS_LABELS[subscription.status] ?? subscription.status : 'Нет подписки'}
                  </span>
                  {subscription?.currentPeriodEnd && (
                    <span className="text-sm text-muted-foreground">
                      {subscription.cancelAtPeriodEnd ? 'Действует до' : 'Продление'} {new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              )}
              {!!subscription?.freeMonthsCredit && (
                <div className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600">
                  <Gift size={14} /> У вас {subscription.freeMonthsCredit} бесплатный месяц по реферальной программе — будет применён при оформлении подписки
                </div>
              )}
              {subscription?.stripeCustomerId && (
                <Button variant="secondary" onClick={handlePortal} loading={openingPortal} className="mt-4 h-9 px-3 text-sm">
                  Управление подпиской →
                </Button>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-1 text-sm font-semibold">Тариф</h2>
              <p className="mb-5 text-xs text-muted-foreground">Без скрытых платежей и ограничений по функциям</p>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">990 ₽</span>
                <span className="pb-1 text-sm text-muted-foreground">за пользователя / месяц</span>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm">
                <Users size={15} className="text-muted-foreground" />
                <span>
                  Сейчас в организации <strong>{subscription?.quantity ?? 1}</strong>{' '}
                  {subscription?.quantity === 1 ? 'пользователь' : 'пользователей'}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Итого в месяц</span>
                <span className="text-lg font-bold">{formatRub(subscription?.monthlyTotal ?? 99000)}</span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Стоимость автоматически пересчитывается при добавлении или удалении сотрудников.
              </p>

              {subscription?.stripeSubscriptionId ? (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-primary py-2.5 text-sm font-medium text-primary">
                  Подписка активна
                </div>
              ) : (
                <Button onClick={handleCheckout} loading={checkingOut} className="mt-5 w-full">
                  Оформить подписку
                </Button>
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
    <Suspense fallback={<AppShell><div className="text-center text-muted-foreground">Загрузка...</div></AppShell>}>
      <BillingContent />
    </Suspense>
  );
}
