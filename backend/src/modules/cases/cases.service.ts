import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // =========================
  // CREATE CASE
  // =========================
  async create(data: {
    clientId: string;
    organizationId: string;
    title: string;
    description?: string;
    caseTypeId?: string;
    userId: string;
  }) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        organizationId: data.organizationId,
      },
    });

    if (!client) {
      throw new NotFoundException(
        'Client not found',
      );
    }

    if (data.caseTypeId) {
      const caseType =
        await this.prisma.caseType.findFirst({
          where: {
            id: data.caseTypeId,
            organizationId:
              data.organizationId,
          },
        });

      if (!caseType) {
        throw new NotFoundException(
          'Case type not found',
        );
      }
    }

    const firstStage =
      await this.prisma.caseStage.findFirst({
        where: {
          organizationId:
            data.organizationId,
        },
        orderBy: {
          order: 'asc',
        },
      });

    const newCase =
      await this.prisma.case.create({
        data: {
          clientId: data.clientId,
          organizationId:
            data.organizationId,
          title: data.title.trim(),
          description:
            data.description?.trim(),
          caseTypeId:
            data.caseTypeId,
          stageId:
            firstStage?.id ?? null,
        },
        include: {
          client: true,
          caseType: true,
          stage: true,
        },
      });

    await this.audit.log({
      organizationId:
        data.organizationId,
      userId: data.userId,
      action: 'CASE_CREATED',
      entity: 'Case',
      entityId: newCase.id,
      caseId: newCase.id,
      meta: {
        title: newCase.title,
        clientId: data.clientId,
        caseTypeId:
          data.caseTypeId,
      },
    });

    return newCase;
  }

  // =========================
  // GET ALL CASES
  // =========================
  async findAll(
    organizationId: string,
  ) {
    return this.prisma.case.findMany({
      where: {
        organizationId,
      },
      include: {
        client: true,
        caseType: true,
        stage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================
  // GET ONE CASE
  // TENANT SAFE
  // =========================
  async findById(
    id: string,
    organizationId: string,
  ) {
    const caseItem =
      await this.prisma.case.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          client: true,
          caseType: true,
          stage: true,
          tasks: true,
          documents: true,
        },
      });

    if (!caseItem) {
      throw new NotFoundException(
        'Case not found',
      );
    }

    return caseItem;
  }

  // =========================
  // UPDATE CASE
  // =========================
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      caseTypeId?: string;
      stageId?: string;
      organizationId: string;
      userId: string;
    },
  ) {
    const existingCase =
      await this.findById(
        id,
        data.organizationId,
      );

    if (data.caseTypeId) {
      const caseType =
        await this.prisma.caseType.findFirst({
          where: {
            id: data.caseTypeId,
            organizationId:
              data.organizationId,
          },
        });

      if (!caseType) {
        throw new NotFoundException(
          'Case type not found',
        );
      }
    }

    if (data.stageId) {
      const stage =
        await this.prisma.caseStage.findFirst({
          where: {
            id: data.stageId,
            organizationId:
              data.organizationId,
          },
        });

      if (!stage) {
        throw new NotFoundException(
          'Stage not found',
        );
      }
    }

    const updated =
      await this.prisma.case.update({
        where: {
          id,
        },
        data: {
          title:
            data.title?.trim(),
          description:
            data.description?.trim(),
          caseTypeId:
            data.caseTypeId,
          stageId:
            data.stageId,
        },
        include: {
          client: true,
          caseType: true,
          stage: true,
        },
      });

    await this.audit.log({
      organizationId:
        data.organizationId,
      userId: data.userId,
      action: 'CASE_UPDATED',
      entity: 'Case',
      entityId: id,
      caseId: id,
      meta: {
        before: {
          title:
            existingCase.title,
          description:
            existingCase.description,
          caseTypeId:
            existingCase.caseTypeId,
          stageId:
            existingCase.stageId,
        },
        after: {
          title:
            updated.title,
          description:
            updated.description,
          caseTypeId:
            updated.caseTypeId,
          stageId:
            updated.stageId,
        },
      },
    });

    return updated;
  }

  // =========================
  // DELETE CASE
  // =========================
  async remove(
    id: string,
    organizationId: string,
    userId: string,
  ) {
    const existingCase =
      await this.findById(
        id,
        organizationId,
      );

    const tasksCount =
      await this.prisma.task.count({
        where: {
          caseId: id,
          organizationId,
        },
      });

    const documentsCount =
      await this.prisma.document.count({
        where: {
          caseId: id,
          organizationId,
        },
      });

    if (
      tasksCount > 0 ||
      documentsCount > 0
    ) {
      throw new BadRequestException(
        'Cannot delete case with related tasks or documents',
      );
    }

    const deleted =
      await this.prisma.case.delete({
        where: {
          id,
        },
      });

    await this.audit.log({
      organizationId,
      userId,
      action: 'CASE_DELETED',
      entity: 'Case',
      entityId: id,
      caseId: id,
      meta: {
        title:
          existingCase.title,
      },
    });

    return deleted;
  }

  // =========================
  // KANBAN BOARD
  // =========================
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
          include: {
            client: true,
            caseType: true,
            stage: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  // =========================
  // MOVE CASE
  // =========================
  async moveCase(
    caseId: string,
    stageId: string,
    organizationId: string,
    userId: string,
  ) {
    const existingCase =
      await this.findById(
        caseId,
        organizationId,
      );

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

    const updated =
      await this.prisma.case.update({
        where: {
          id: caseId,
        },
        data: {
          stageId,
        },
        include: {
          client: true,
          caseType: true,
          stage: true,
        },
      });

    await this.audit.log({
      organizationId,
      userId,
      action: 'CASE_MOVED_STAGE',
      entity: 'Case',
      entityId: caseId,
      caseId,
      meta: {
        fromStageId:
          existingCase.stageId,
        toStageId: stageId,
      },
    });

    return updated;
  }
  }
