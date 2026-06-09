import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

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
  // GET ALL CLIENTS (TENANT SAFE)
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organizationId },
      include: {
        cases: true,
      },
    });
  }

  // =========================
  // GET ONE CLIENT
  // =========================
  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        cases: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  // =========================
  // UPDATE CLIENT
  // =========================
  async update(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      email?: string;
      notes?: string;
    },
  ) {
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  // =========================
  // DELETE CLIENT
  // =========================
  async remove(id: string) {
    return this.prisma.client.delete({
      where: { id },
    });
  }
}
