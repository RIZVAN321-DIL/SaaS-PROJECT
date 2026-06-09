import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.auditLog.create({
      data,
    });
  }

  // =========================
  // GET LOGS (TENANT SAFE)
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
