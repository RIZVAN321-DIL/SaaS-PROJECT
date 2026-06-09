import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  // =========================
  // CRUD METHODS
  // =========================

  async findAll(organizationId: string) {
    return this.prisma.caseType.findMany({
      where: { organizationId },
    });
  }

  async findOne(id: string) {
    const caseType = await this.prisma.caseType.findUnique({
      where: { id },
    });

    if (!caseType) {
      throw new NotFoundException('CaseType not found');
    }

    return caseType;
  }

  async create(data: CreateCaseTypeDto) {
    return this.prisma.caseType.create({
      data,
    });
  }

  async update(
    id: string,
    data: UpdateCaseTypeDto,
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

  // =========================
  // RULES ENGINE
  // =========================

  private applyRules(
    rules: Rule[],
    context: CreateCaseFromTypeDto,
  ): string[] {
    const tasks: string[] = [];

    if (!rules || rules.length === 0) {
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
            rule.if.field as keyof CreateCaseFromTypeDto
          ];

        if (fieldValue !== rule.if.equals) {
          match = false;
        }
      }

      if (
        match &&
        rule.then?.addTasks &&
        Array.isArray(rule.then.addTasks)
      ) {
        tasks.push(...rule.then.addTasks);
      }
    }

    return tasks;
  }

  // =========================
  // CREATE CASE FROM CASE TYPE
  // =========================

  async createCaseFromType(
    data: CreateCaseFromTypeDto,
  ) {
    const caseType =
      await this.prisma.caseType.findUnique({
        where: {
          id: data.caseTypeId,
        },
      });

    if (!caseType) {
      throw new NotFoundException(
        'CaseType not found',
      );
    }

    const tasksTemplate =
      (caseType.tasksTemplate as string[]) || [];

    const documentsTemplate =
      (caseType.documentsTemplate as string[]) || [];

    const rules =
      (caseType.rules as Rule[]) || [];

    const ruleTasks =
      this.applyRules(rules, data);

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
          caseTypeId: data.caseTypeId,
          title: data.title,
          description:
            data.description,
        },
      });

    // =========================
    // TASKS
    // =========================

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

    // =========================
    // DOCUMENTS
    // =========================

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

    return newCase;
  }
          }
