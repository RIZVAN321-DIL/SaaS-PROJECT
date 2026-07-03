import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { DeadlinesService } from './deadlines.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [DeadlinesService],
})
export class DeadlinesModule {}
