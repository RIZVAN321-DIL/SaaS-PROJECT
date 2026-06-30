import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { BillingModule } from '../billing/billing.module';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    PrismaModule,
    BillingModule,
  ],
  providers: [
    UsersService,
  ],
  controllers: [
    UsersController,
  ],
  exports: [
    UsersService,
  ],
})
export class UsersModule {}
