import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// =========================
// DATABASE
// =========================
import { PrismaModule } from './database/prisma.module';

// =========================
// AUTH & RBAC CORE
// =========================
import { AuthModule } from './modules/auth/auth.module';

// 🔥 RBAC GUARDS
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// =========================
// CORE MODULES
// =========================
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

// =========================
// CRM CORE
// =========================
import { ClientsModule } from './modules/clients/clients.module';
import { CasesModule } from './modules/cases/cases.module';
import { CaseTypesModule } from './modules/case-types/case-types.module';

// =========================
// PIPELINE
// =========================
import { CaseStageModule } from './modules/case-stage/case-stage.module';

// =========================
// DASHBOARD
// =========================
import { DashboardModule } from './modules/dashboard/dashboard.module';

// =========================
// NOTIFICATIONS
// =========================
import { NotificationsModule } from './modules/notifications/notifications.module';

// =========================
// SEARCH (HARDENING LAYER)
// =========================
import { SearchModule } from './modules/search/search.module';

// =========================
// OPERATIONS
// =========================
import { TasksModule } from './modules/tasks/tasks.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    // Core
    AuthModule,
    UsersModule,
    OrganizationsModule,

    // CRM
    ClientsModule,
    CasesModule,
    CaseTypesModule,

    // Pipeline
    CaseStageModule,

    // Dashboard
    DashboardModule,

    // Notifications
    NotificationsModule,

    // Search
    SearchModule,

    // Operations
    TasksModule,
    DocumentsModule,
    CalendarModule,
  ],

  // =========================
  // GLOBAL RBAC LAYER
  // =========================
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
