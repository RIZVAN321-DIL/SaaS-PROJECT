import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger =
    new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        {
          emit: 'stdout',
          level: 'warn',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
      ],
    });
  }

  // =========================
  // CONNECT
  // =========================
  async onModuleInit() {
    await this.$connect();

    this.logger.log(
      'Prisma connected to database',
    );
  }

  // =========================
  // DISCONNECT
  // =========================
  async onModuleDestroy() {
    await this.$disconnect();

    this.logger.log(
      'Prisma disconnected',
    );
  }

  // =========================
  // APP SHUTDOWN SUPPORT
  // =========================
  enableShutdownHooks(app: {
    close(): Promise<void>;
  }) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
