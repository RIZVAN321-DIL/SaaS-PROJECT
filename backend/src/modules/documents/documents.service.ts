import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    caseId: string;
    name: string;
    fileUrl?: string;
    type?: string;
  }) {
    return this.prisma.document.create({
      data,
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.document.findMany({
      where: { organizationId },
      include: { case: true },
    });
  }

  async findById(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
