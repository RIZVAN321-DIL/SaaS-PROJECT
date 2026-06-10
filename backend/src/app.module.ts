import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// =========================
// RATE LIMITING
// =========================
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// =========================
// DATABASE
// =========================
import { PrismaModule } from './database/prisma.module';

// =========================
// AUTH & RBAC CORE
// =========================
import { AuthModule } from './modules/auth/auth.module';

// 🔥 GUARDS
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
// SEARCH
// =========================
import { SearchModule } from './modules/search/search.module';

// =========================
// AUDIT
// =========================
import { AuditModule } from './modules/audit/audit.module';

// =========================
// OPERATIONS
// =========================
import { TasksModule } from './modules/tasks/tasks.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    // =========================
    // CONFIG
    // =========================
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),

    // =========================
    // RATE LIMITING
    // =========================
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // =========================
    // DATABASE
    // =========================
    PrismaModule,

    // =========================
    // CORE
    // =========================
    AuthModule,
    UsersModule,
    OrganizationsModule,

    // =========================
    // CRM
    // =========================
    ClientsModule,
    CasesModule,
    CaseTypesModule,

    // =========================
    // PIPELINE
    // =========================
    CaseStageModule,

    // =========================
    // DASHBOARD
    // =========================
    DashboardModule,

    // =========================
    // NOTIFICATIONS
    // =========================
    NotificationsModule,

    // =========================
    // SEARCH
    // =========================
    SearchModule,

    // =========================
    // AUDIT
    // =========================
    AuditModule,

    // =========================
    // OPERATIONS
    // =========================
    TasksModule,
    DocumentsModule,
    CalendarModule,
  ],

  providers: [
    // =========================
    // RATE LIMIT
    // =========================
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // =========================
    // AUTH
    // =========================
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // =========================
    // RBAC
    // =========================
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
