import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  readonly client: Stripe;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error(
        'Stripe billing is not configured. Set STRIPE_SECRET_KEY.',
      );
    }
    this.client = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    });
  }
}
