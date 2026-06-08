import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organizationId },
    });
  }

  async findById(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
    });
  }

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

  async remove(id: string) {
    return this.prisma.client.delete({
      where: { id },
    });
  }
}
