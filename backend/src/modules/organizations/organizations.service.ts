import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createOrganization(name: string) {
    const existing =
      await this.prisma.organization.findFirst({
        where: {
          name,
        },
      });

    if (existing) {
      throw new ConflictException(
        'Organization already exists',
      );
    }

    return this.prisma.organization.create({
      data: {
        name,
      },
    });
  }

  async addUserToOrganization(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        organizationId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async getUsersInOrganization(
    organizationId: string,
  ) {
    const organization =
      await this.prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    return this.prisma.user.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrganizationById(
    organizationId: string,
  ) {
    const organization =
      await this.prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              cases: true,
              tasks: true,
            },
          },
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    return organization;
  }

  async getAllOrganizations() {
    return this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
