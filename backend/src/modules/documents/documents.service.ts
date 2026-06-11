import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CREATE DOCUMENT
  // =========================
  async create(data: {
    organizationId: string;
    caseId: string;
    name: string;
    fileUrl?: string;
    type?: string;
  }) {
    const caseItem =
      await this.prisma.case.findFirst({
        where: {
          id: data.caseId,
          organizationId:
            data.organizationId,
        },
      });

    if (!caseItem) {
      throw new NotFoundException(
        'Case not found',
      );
    }

    return this.prisma.document.create({
      data,
    });
  }

  // =========================
  // GET ALL DOCUMENTS
  // =========================
  async findAll(
    organizationId: string,
  ) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
      },
      include: {
        case: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================
  // GET ONE DOCUMENT
  // TENANT SAFE
  // =========================
  async findById(
    id: string,
    organizationId: string,
  ) {
    const doc =
      await this.prisma.document.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          case: true,
        },
      });

    if (!doc) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    return doc;
  }

  // =========================
  // DELETE DOCUMENT
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

    return this.prisma.document.delete({
      where: {
        id,
      },
    });
  }
}
