import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseStageService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.caseStage.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const stage =
      await this.prisma.caseStage.findUnique({
        where: { id },
      });

    if (!stage) {
      throw new NotFoundException(
        'Stage not found',
      );
    }

    return stage;
  }

  async create(data: {
    name: string;
    order: number;
    color?: string;
    organizationId: string;
  }) {
    return this.prisma.caseStage.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      order?: number;
      color?: string;
    },
  ) {
    return this.prisma.caseStage.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.caseStage.delete({
      where: { id },
    });
  }

  async moveCase(
    caseId: string,
    stageId: string,
  ) {
    const stage =
      await this.prisma.caseStage.findUnique({
        where: { id: stageId },
      });

    if (!stage) {
      throw new NotFoundException(
        'Stage not found',
      );
    }

    return this.prisma.case.update({
      where: { id: caseId },
      data: { stageId },
    });
  }

  async getBoard(
    organizationId: string,
  ) {
    return this.prisma.caseStage.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
      include: {
        cases: {
          include: {
            client: true,
          },
        },
      },
    });
  }
}
