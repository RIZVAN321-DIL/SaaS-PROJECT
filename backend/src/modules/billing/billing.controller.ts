import {
  Controller,
  Get,
  Post,
  Req,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../auth/jwt.strategy';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

  // =========================
  // ИНФОРМАЦИЯ О ЦЕНЕ (per-seat)
  // ₽990 за пользователя в месяц — единая схема, без тарифов
  // =========================
  @Public()
  @Get('pricing')
  async getPricing() {
    return { pricePerSeat: 99000, currency: 'rub' };
  }

  @Get('subscription')
  async getSubscription(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.billingService.getSubscription(user.organizationId);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post('checkout')
  async createCheckout(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.billingService.createCheckoutSession(
      user.organizationId,
      user.email,
    );
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post('portal')
  async createPortal(@Req() req: Request) {
    const user = req.user as JwtUser;
    return this.billingService.createPortalSession(user.organizationId);
  }

  @Public()
  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    if (!req.rawBody || !signature) {
      throw new BadRequestException(
        'Missing Stripe signature or raw body',
      );
    }
    return this.billingService.handleWebhook(req.rawBody, signature);
  }
}
