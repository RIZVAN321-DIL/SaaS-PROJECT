import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger =
    new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // LOG ACTION
  // =========================
  async log(data: {
    organizationId: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    meta?: any;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data,
      });
    } catch (error) {
      this.logger.error(
        'Audit log failed',
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return null;
    }
  }

  // =========================
  // GET LOGS
  // =========================
  async findAll(
    organizationId: string,
    page = 1,
    limit = 50,
  ) {
    const skip =
      (page - 1) * limit;

    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
  }

  // =========================
  // GET LOGS BY USER
  // =========================
  async findByUser(
    organizationId: string,
    userId: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================
  // GET LOGS BY ENTITY
  // =========================
  async findByEntity(
    organizationId: string,
    entity: string,
    entityId?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entity,
        ...(entityId && {
          entityId,
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================
  // GET LOGS BY ACTION
  // =========================
  async findByAction(
    organizationId: string,
    action: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        action,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
