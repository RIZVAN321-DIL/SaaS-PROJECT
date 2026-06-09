import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './database/prisma.module';

// Auth & Core
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

// CRM Core
import { ClientsModule } from './modules/clients/clients.module';
import { CasesModule } from './modules/cases/cases.module';
import { CaseTypesModule } from './modules/case-types/case-types.module';

// 🆕 Case Pipeline
import { CaseStageModule } from './modules/case-stage/case-stage.module';

// 🆕 Dashboard / Analytics
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Operations
import { TasksModule } from './modules/tasks/tasks.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    // ENV config (global)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // DB layer
    PrismaModule,

    // Core SaaS
    AuthModule,
    UsersModule,
    OrganizationsModule,

    // CRM domain
    ClientsModule,
    CasesModule,
    CaseTypesModule,

    // 🆕 Pipeline layer
    CaseStageModule,

    // 🆕 Dashboard layer
    DashboardModule,

    // Operations layer
    TasksModule,
    DocumentsModule,
    CalendarModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
