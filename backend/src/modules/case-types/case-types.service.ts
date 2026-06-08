import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseTypesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    name: string;
    description?: string;
  }) {
    return this.prisma.caseType.create({
      data,
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.caseType.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    });
  }

  async findById(id: string) {
    const type = await this.prisma.caseType.findUnique({
      where: { id },
      include: { cases: true },
    });

    if (!type) throw new NotFoundException('CaseType not found');
    return type;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ) {
    return this.prisma.caseType.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.caseType.delete({
      where: { id },
    });
  }
}
