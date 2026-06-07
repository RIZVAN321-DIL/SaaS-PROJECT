import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  // подключение к БД при старте приложения
  async onModuleInit() {
    await this.$connect();
    console.log('🗄 Prisma connected to database');
  }

  // корректное закрытие соединения
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
