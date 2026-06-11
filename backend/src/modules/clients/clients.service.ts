import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CREATE CLIENT
  // =========================
  async create(data: {
    organizationId: string;
    fullName: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) {
    return this.prisma.client.create({
      data,
    });
  }

  // =========================
  // GET ALL CLIENTS
  // =========================
  async findAll(
    organizationId: string,
  ) {
    return this.prisma.client.findMany({
      where: {
        organizationId,
      },
      include: {
        cases: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================
  // GET ONE CLIENT
  // TENANT SAFE
  // =========================
  async findById(
    id: string,
    organizationId: string,
  ) {
    const client =
      await this.prisma.client.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          cases: true,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Client not found',
      );
    }

    return client;
  }

  // =========================
  // UPDATE CLIENT
  // TENANT SAFE
  // =========================
  async update(
    id: string,
    organizationId: string,
    data: {
      fullName?: string;
      phone?: string;
      email?: string;
      notes?: string;
    },
  ) {
    await this.findById(
      id,
      organizationId,
    );

    return this.prisma.client.update({
      where: {
        id,
      },
      data,
    });
  }

  // =========================
  // DELETE CLIENT
  // TENANT SAFE
  // =========================
  async remove(
    id: string,
    organizationId: string,
  ) {
    await this.findById(
      id,
      organizationId,
    );

    return this.prisma.client.delete({
      where: {
        id,
      },
    });
  }
}
