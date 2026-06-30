import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { StripeService } from './stripe.service';

// Цена за одно место (seat) в минимальных единицах валюты — ₽990
const PRICE_PER_SEAT = 99000;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  private get stripe(): Stripe {
    return this.stripeService.client;
  }

  private get frontendUrl(): string {
    return (
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    );
  }

  private get stripeSeatPriceId(): string | undefined {
    return this.config.get<string>('STRIPE_SEAT_PRICE_ID');
  }

  async ensureSubscription(organizationId: string) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });
    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          organizationId,
          pricePerSeat: PRICE_PER_SEAT,
          quantity: await this.countUsers(organizationId),
        },
      });
    }
    return subscription;
  }

  private async countUsers(organizationId: string): Promise<number> {
    const count = await this.prisma.user.count({ where: { organizationId } });
    return Math.max(count, 1);
  }

  async getSubscription(organizationId: string) {
    const subscription = await this.ensureSubscription(organizationId);
    return {
      ...subscription,
      isActive: this.computeIsActive(subscription),
      monthlyTotal: subscription.pricePerSeat * subscription.quantity,
    };
  }

  private computeIsActive(subscription: {
    status: string;
    manualOverride: boolean;
    overrideExpiresAt: Date | null;
  }): boolean {
    if (subscription.manualOverride) {
      if (!subscription.overrideExpiresAt) return true;
      return subscription.overrideExpiresAt > new Date();
    }
    return (
      subscription.status === 'active' ||
      subscription.status === 'trialing'
    );
  }

  // =========================
  // СИНХРОНИЗАЦИЯ КОЛИЧЕСТВА МЕСТ (seats)
  // Вызывается при добавлении/удалении сотрудника организации.
  // Обновляет quantity локально и, если оформлена реальная Stripe-подписка,
  // синхронизирует quantity в Stripe (это меняет сумму следующего списания).
  // =========================
  async syncSeats(organizationId: string) {
    const subscription = await this.ensureSubscription(organizationId);
    const quantity = await this.countUsers(organizationId);

    const updated = await this.prisma.subscription.update({
      where: { organizationId },
      data: { quantity },
    });

    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await this.stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId,
        );
        const item = stripeSubscription.items.data[0];
        if (item) {
          await this.stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            {
              items: [{ id: item.id, quantity }],
              proration_behavior: 'create_prorations',
            },
          );
        }
      } catch (err) {
        this.logger.error(
          `Не удалось синхронизировать quantity в Stripe для org ${organizationId}`,
          err as Error,
        );
      }
    }

    return updated;
  }

  // =========================
  // CHECKOUT — per-seat подписка
  // quantity = текущее число сотрудников организации,
  // price = фиксированная цена за место (pricePerSeat)
  // =========================
  async createCheckoutSession(organizationId: string, userEmail: string) {
    if (!this.stripeSeatPriceId) {
      throw new BadRequestException(
        'Оплата ещё не настроена. Установите STRIPE_SEAT_PRICE_ID.',
      );
    }

    const subscription = await this.ensureSubscription(organizationId);
    const quantity = await this.countUsers(organizationId);

    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        metadata: { organizationId },
      });
      customerId = customer.id;
      await this.prisma.subscription.update({
        where: { organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Если у организации есть накопленные бесплатные месяцы (реферальная
    // программа) и она ещё не оформляла реальную Stripe-подписку — даём trial.
    const trialDays =
      !subscription.stripeSubscriptionId && subscription.freeMonthsCredit > 0
        ? subscription.freeMonthsCredit * 30
        : undefined;

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        { price: this.stripeSeatPriceId, quantity },
      ],
      success_url: `${this.frontendUrl}/settings/billing?success=true`,
      cancel_url: `${this.frontendUrl}/settings/billing?canceled=true`,
      client_reference_id: organizationId,
      metadata: { organizationId },
      subscription_data: {
        metadata: { organizationId },
        ...(trialDays ? { trial_period_days: trialDays } : {}),
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Не удалось создать сессию оплаты',
      );
    }

    if (trialDays) {
      await this.prisma.subscription.update({
        where: { organizationId },
        data: { freeMonthsCredit: 0 },
      });
    }

    return { url: session.url };
  }

  // =========================
  // РЕФЕРАЛЬНАЯ ПРОГРАММА: начислить бесплатные месяцы
  // Начисляется в виде кредита, который применяется как Stripe trial
  // при следующем оформлении подписки (см. createCheckoutSession).
  // =========================
  async addFreeMonths(organizationId: string, months: number) {
    await this.ensureSubscription(organizationId);
    return this.prisma.subscription.update({
      where: { organizationId },
      data: { freeMonthsCredit: { increment: months } },
    });
  }

  async createPortalSession(organizationId: string) {
    const subscription = await this.ensureSubscription(organizationId);
    if (!subscription.stripeCustomerId) {
      throw new BadRequestException(
        'У организации ещё нет оформленной подписки',
      );
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${this.frontendUrl}/settings/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.warn(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        break;
    }

    return { received: true };
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId =
      session.client_reference_id || session.metadata?.organizationId;
    if (!organizationId || typeof session.subscription !== 'string') {
      this.logger.warn(
        'checkout.session.completed без organizationId/subscription',
      );
      return;
    }
    await this.ensureSubscription(organizationId);
    await this.prisma.subscription.update({
      where: { organizationId },
      data: {
        stripeSubscriptionId: session.subscription,
        ...(typeof session.customer === 'string'
          ? { stripeCustomerId: session.customer }
          : {}),
      },
    });
  }

  private async onSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ) {
    const organizationId = stripeSubscription.metadata?.organizationId;
    if (!organizationId) {
      this.logger.warn(
        'subscription event без organizationId в metadata',
      );
      return;
    }

    const item = stripeSubscription.items.data[0];
    const quantity = item?.quantity ?? undefined;

    const customerId =
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : undefined;

    await this.prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        status: stripeSubscription.status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        pricePerSeat: PRICE_PER_SEAT,
        quantity: quantity ?? 1,
      },
      update: {
        status: stripeSubscription.status,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        ...(quantity ? { quantity } : {}),
      },
    });
  }

  private async onSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ) {
    const organizationId = stripeSubscription.metadata?.organizationId;
    if (!organizationId) return;
    await this.prisma.subscription.updateMany({
      where: { organizationId },
      data: { status: 'canceled' },
    });
  }
}
