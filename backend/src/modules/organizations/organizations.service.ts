import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(name: string) {
    return this.prisma.organization.create({
      data: { name },
    });
  }

  async addUserToOrganization(userId: number, organizationId: number) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId },
    });

    return user;
  }

  async getUsersInOrganization(organizationId: number) {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
    });
    return users;
  }

  async getAllOrganizations() {
    return this.prisma.organization.findMany();
  }
}
