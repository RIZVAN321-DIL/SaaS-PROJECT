import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseStageService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    organizationId: string,
  ) {
    return this.prisma.caseStage.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ) {
    const stage =
      await this.prisma.caseStage.findFirst({
        where: {
          id,
          organizationId,
        },
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
    const existing =
      await this.prisma.caseStage.findFirst({
        where: {
          organizationId:
            data.organizationId,
          order: data.order,
        },
      });

    if (existing) {
      throw new ConflictException(
        'Stage order already exists',
      );
    }

    return this.prisma.caseStage.create({
      data,
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: {
      name?: string;
      order?: number;
      color?: string;
    },
  ) {
    const stage =
      await this.prisma.caseStage.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!stage) {
      throw new NotFoundException(
        'Stage not found',
      );
    }

    if (
      data.order !== undefined &&
      data.order !== stage.order
    ) {
      const duplicate =
        await this.prisma.caseStage.findFirst({
          where: {
            organizationId,
            order: data.order,
            NOT: {
              id,
            },
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'Stage order already exists',
        );
      }
    }

    return this.prisma.caseStage.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(
    id: string,
    organizationId: string,
  ) {
    const stage =
      await this.prisma.caseStage.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!stage) {
      throw new NotFoundException(
        'Stage not found',
      );
    }

    const linkedCases =
      await this.prisma.case.count({
        where: {
          stageId: id,
          organizationId,
        },
      });

    if (linkedCases > 0) {
      throw new ConflictException(
        'Stage contains cases',
      );
    }

    return this.prisma.caseStage.delete({
      where: {
        id,
      },
    });
  }

  async moveCase(
    caseId: string,
    stageId: string,
    organizationId: string,
  ) {
    const stage =
      await this.prisma.caseStage.findFirst({
        where: {
          id: stageId,
          organizationId,
        },
      });

    if (!stage) {
      throw new NotFoundException(
        'Stage not found',
      );
    }

    const caseItem =
      await this.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

    if (!caseItem) {
      throw new NotFoundException(
        'Case not found',
      );
    }

    return this.prisma.case.update({
      where: {
        id: caseId,
      },
      data: {
        stageId,
      },
    });
  }

  async getBoard(
    organizationId: string,
  ) {
    return this.prisma.caseStage.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        cases: {
          where: {
            organizationId,
          },
          include: {
            client: true,
            caseType: true,
            stage: true,
          },
        },
      },
    });
  }
}
