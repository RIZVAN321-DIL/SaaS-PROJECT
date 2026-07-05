import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CaseStageService } from '../case-stage/case-stage.service';

import { CreateCaseTypeDto } from './dto/create-case-type.dto';
import { UpdateCaseTypeDto } from './dto/update-case-type.dto';
import { CreateCaseFromTypeDto } from './dto/create-case-from-type.dto';

type Rule = {
  if: {
    field: string;
    equals: string;
  };
  then: {
    addTasks?: string[];
  };
};

@Injectable()
export class CaseTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly caseStages: CaseStageService,
  ) {}

  // =========================
  // CRUD METHODS
  // =========================

  async findAll(
    organizationId: string,
  ) {
    return this.prisma.caseType.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ) {
    const caseType =
      await this.prisma.caseType.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!caseType) {
      throw new NotFoundException(
        'CaseType not found',
      );
    }

    return caseType;
  }

  async create(
    data: CreateCaseTypeDto & {
      organizationId: string;
    },
  ) {
    const existing =
      await this.prisma.caseType.findFirst({
        where: {
          organizationId:
            data.organizationId,
          name: data.name,
        },
      });

    if (existing) {
      throw new ConflictException(
        'CaseType already exists',
      );
    }

    return this.prisma.caseType.create({
      data,
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateCaseTypeDto,
  ) {
    const caseType =
      await this.prisma.caseType.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!caseType) {
      throw new NotFoundException(
        'CaseType not found',
      );
    }

    if (
      data.name &&
      data.name !== caseType.name
    ) {
      const duplicate =
        await this.prisma.caseType.findFirst({
          where: {
            organizationId,
            name: data.name,
            NOT: {
              id,
            },
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'CaseType already exists',
        );
      }
    }

    return this.prisma.caseType.update({
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
    const caseType =
      await this.prisma.caseType.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!caseType) {
      throw new NotFoundException(
        'CaseType not found',
      );
    }

    const linkedCases =
      await this.prisma.case.count({
        where: {
          caseTypeId: id,
          organizationId,
        },
      });

    if (linkedCases > 0) {
      throw new ConflictException(
        'CaseType is used by cases',
      );
    }

    return this.prisma.caseType.delete({
      where: {
        id,
      },
    });
  }

  // =========================
  // RULES ENGINE
  // =========================

  private applyRules(
    rules: Rule[],
    context: CreateCaseFromTypeDto,
  ): string[] {
    const tasks: string[] = [];

    if (!rules?.length) {
      return tasks;
    }

    for (const rule of rules) {
      let match = true;

      if (
        rule.if?.field &&
        rule.if?.equals
      ) {
        const fieldValue =
          context[
            rule.if
              .field as keyof CreateCaseFromTypeDto
          ];

        if (
          String(fieldValue) !==
          rule.if.equals
        ) {
          match = false;
        }
      }

      if (
        match &&
        Array.isArray(
          rule.then?.addTasks,
        )
      ) {
        tasks.push(
          ...rule.then.addTasks,
        );
      }
    }

    return tasks;
  }

  // =========================
  // CREATE CASE FROM TYPE
  // =========================

  async createCaseFromType(
    data: CreateCaseFromTypeDto & {
      organizationId: string;
    },
  ) {
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
        'CaseType not found',
      );
    }

    const client =
      await this.prisma.client.findFirst({
        where: {
          id: data.clientId,
          organizationId:
            data.organizationId,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Client not found',
      );
    }

    // Первая стадия эффективной воронки типа дела: собственная, если задана,
    // иначе дефолтная воронка организации.
    const firstStage =
      await this.caseStages.getFirstEffectiveStage(
        data.organizationId,
        data.caseTypeId,
      );

    const tasksTemplate =
      Array.isArray(
        caseType.tasksTemplate,
      )
        ? (caseType.tasksTemplate as string[])
        : [];

    const documentsTemplate =
      Array.isArray(
        caseType.documentsTemplate,
      )
        ? (caseType.documentsTemplate as string[])
        : [];

    const rules = Array.isArray(
      caseType.rules,
    )
      ? (caseType.rules as Rule[])
      : [];

    const ruleTasks =
      this.applyRules(
        rules,
        data,
      );

    const allTasks = [
      ...tasksTemplate,
      ...ruleTasks,
    ];

    const newCase =
      await this.prisma.case.create({
        data: {
          organizationId:
            data.organizationId,
          clientId: data.clientId,
          caseTypeId:
            data.caseTypeId,
          title: data.title,
          description:
            data.description,
          stageId:
            firstStage?.id ?? null,
        },
      });

    if (allTasks.length > 0) {
      await this.prisma.task.createMany({
        data: allTasks.map(
          (taskTitle) => ({
            organizationId:
              data.organizationId,
            caseId: newCase.id,
            title: taskTitle,
          }),
        ),
      });
    }

    if (
      documentsTemplate.length > 0
    ) {
      await this.prisma.document.createMany({
        data: documentsTemplate.map(
          (documentName) => ({
            organizationId:
              data.organizationId,
            caseId: newCase.id,
            name: documentName,
            type: 'template',
          }),
        ),
      });
    }

    return this.prisma.case.findUnique({
      where: {
        id: newCase.id,
      },
      include: {
        client: true,
        caseType: true,
        stage: true,
        tasks: true,
        documents: true,
      },
    });
  }
}
