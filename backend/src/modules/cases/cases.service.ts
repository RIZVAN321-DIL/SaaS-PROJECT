import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    organizationId: string;
    title: string;
    description?: string;
    caseTypeId?: string;
  }) {
    return this.prisma.case.create({
      data,
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.case.findMany({
      where: { organizationId },
      include: { client: true, caseType: true },
    });
  }

  async findById(id: string) {
    const caseItem = await this.prisma.case.findUnique({
      where: { id },
      include: { client: true, caseType: true },
    });
    if (!caseItem) throw new NotFoundException('Case not found');
    return caseItem;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      caseTypeId?: string;
    },
  ) {
    return this.prisma.case.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.case.delete({
      where: { id },
    });
  }
}
