import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { StripeService } from './stripe.service';

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

  async ensureSubscription(organizationId: string) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });
    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: { organizationId },
        include: { plan: true },
      });
    }
    return subscription;
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getSubscription(organizationId: string) {
    const subscription = await this.ensureSubscription(organizationId);
    return {
      ...subscription,
      isActive: this.computeIsActive(subscription),
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

  async createCheckoutSession(
    organizationId: string,
    planId: string,
    userEmail: string,
  ) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Тариф не найден');
    }
    if (!plan.stripePriceId) {
      throw new BadRequestException(
        'Для этого тарифа не настроена оплата в Stripe',
      );
    }

    const subscription = await this.ensureSubscription(organizationId);
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

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/settings/billing?success=true`,
      cancel_url: `${this.frontendUrl}/settings/billing?canceled=true`,
      client_reference_id: organizationId,
      metadata: { organizationId, planId: plan.id },
      subscription_data: {
        metadata: { organizationId, planId: plan.id },
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Не удалось создать сессию оплаты',
      );
    }

    return { url: session.url };
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

    const priceId = stripeSubscription.items.data[0]?.price.id;
    const plan = priceId
      ? await this.prisma.plan.findFirst({
          where: { stripePriceId: priceId },
        })
      : null;

    const customerId =
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : undefined;

    await this.prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        planId: plan?.id,
        status: stripeSubscription.status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      update: {
        planId: plan?.id,
        status: stripeSubscription.status,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
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
