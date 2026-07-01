import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllOrganizations() {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { users: true, cases: true, clients: true } },
      },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      usersCount: org._count.users,
      casesCount: org._count.cases,
      clientsCount: org._count.clients,
      subscription: org.subscription,
    }));
  }

  async grantOverride(
    organizationId: string,
    data: { reason?: string; expiresAt?: string },
    adminUserId: string,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        manualOverride: true,
        overrideReason: data.reason,
        overrideExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        overrideGrantedBy: adminUserId,
        overrideGrantedAt: new Date(),
      },
      update: {
        manualOverride: true,
        overrideReason: data.reason,
        overrideExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        overrideGrantedBy: adminUserId,
        overrideGrantedAt: new Date(),
      },
    });
  }

  async revokeOverride(organizationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { organizationId },
      data: {
        manualOverride: false,
        overrideReason: null,
        overrideExpiresAt: null,
        overrideGrantedBy: null,
        overrideGrantedAt: null,
      },
    });
  }

  // =========================
  // DELETE ORGANIZATION
  // Удаляем в правильном порядке: сначала зависимые записи без каскада,
  // затем пользователей и саму организацию.
  // =========================
  async deleteOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Организация не найдена');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Audit logs
      await tx.auditLog.deleteMany({ where: { organizationId } });

      // 2. Calendar events
      await tx.calendarEvent.deleteMany({ where: { organizationId } });

      // 3. Documents
      await tx.document.deleteMany({ where: { organizationId } });

      // 4. Tasks
      await tx.task.deleteMany({ where: { organizationId } });

      // 5. Cases
      await tx.case.deleteMany({ where: { organizationId } });

      // 6. Clients
      await tx.client.deleteMany({ where: { organizationId } });

      // 7. Case stages и types
      await tx.caseStage.deleteMany({ where: { organizationId } });
      await tx.caseType.deleteMany({ where: { organizationId } });

      // 8. Пользователи: сначала чистим токены и OTP
      const users = await tx.user.findMany({
        where: { organizationId },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        await tx.loginOtp.deleteMany({ where: { userId: { in: userIds } } });
        await tx.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
      }

      await tx.user.deleteMany({ where: { organizationId } });

      // 9. Подписка
      await tx.subscription.deleteMany({ where: { organizationId } });

      // 10. Организация
      await tx.organization.delete({ where: { id: organizationId } });
    });

    return { success: true, deletedOrganizationId: organizationId };
  }
  }
