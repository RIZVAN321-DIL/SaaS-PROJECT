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
        overrideExpiresAt: data.expiresAt
          ? new Date(data.expiresAt)
          : null,
        overrideGrantedBy: adminUserId,
        overrideGrantedAt: new Date(),
      },
      update: {
        manualOverride: true,
        overrideReason: data.reason,
        overrideExpiresAt: data.expiresAt
          ? new Date(data.expiresAt)
          : null,
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
}
