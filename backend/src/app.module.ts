import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './database/prisma.module';

// Core SaaS modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

// Business modules
import { ClientsModule } from './modules/clients/clients.module';
import { CasesModule } from './modules/cases/cases.module';
import { CaseTypesModule } from './modules/case-types/case-types.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    // 🔧 Config (env, settings)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 🗄 Database layer
    PrismaModule,

    // 🔐 Core SaaS
    AuthModule,
    UsersModule,
    OrganizationsModule,

    // 📦 Business logic
    ClientsModule,
    CasesModule,
    CaseTypesModule,
    TasksModule,
    DocumentsModule,
    CalendarModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
