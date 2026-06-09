import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseTypesService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CRUD METHODS
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.caseType.findMany({ where: { organizationId } });
  }

  async findOne(id: string) {
    const caseType = await this.prisma.caseType.findUnique({ where: { id } });
    if (!caseType) throw new NotFoundException('CaseType not found');
    return caseType;
  }

  async create(data: {
    name: string;
    description?: string;
    organizationId: string;
    tasksTemplate?: any[];
    documentsTemplate?: any[];
    rules?: any[];
  }) {
    return this.prisma.caseType.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.caseType.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.caseType.delete({ where: { id } });
  }

  // =========================
  // RULES ENGINE
  // =========================
  private applyRules(rules: any[], context: any): string[] {
    const tasks: string[] = [];

    if (!rules || rules.length === 0) return tasks;

    for (const rule of rules) {
      const condition = rule.if;
      const thenBlock = rule.then;

      let match = true;

      // SIMPLE CONDITIONS
      if (condition.field && condition.equals) {
        if (context[condition.field] !== condition.equals) {
          match = false;
        }
      }

      if (match && thenBlock?.addTasks) {
        tasks.push(...thenBlock.addTasks);
      }
    }

    return tasks;
  }

  // =========================
  // CREATE CASE FROM CASE TYPE
  // =========================
  async createCaseFromType(data: {
    caseTypeId: string;
    organizationId: string;
    clientId: string;
    title: string;
    description?: string;
    priority?: string;
  }) {
    const caseType = await this.prisma.caseType.findUnique({
      where: { id: data.caseTypeId },
    });

    if (!caseType) {
      throw new NotFoundException('CaseType not found');
    }

    const tasksTemplate: string[] = caseType.tasksTemplate as any || [];
    const documentsTemplate: string[] = caseType.documentsTemplate as any || [];
    const rules: any[] = caseType.rules as any || [];

    // 🧠 APPLY RULES ENGINE
    const ruleTasks = this.applyRules(rules, data);
    const allTasks = [...tasksTemplate, ...ruleTasks];

    const newCase = await this.prisma.case.create({
      data: {
        organizationId: data.organizationId,
        clientId: data.clientId,
        caseTypeId: data.caseTypeId,
        title: data.title,
        description: data.description,
      },
    });

    // TASKS
    if (allTasks.length > 0) {
      await this.prisma.task.createMany({
        data: allTasks.map((task) => ({
          organizationId: data.organizationId,
          caseId: newCase.id,
          title: task,
        })),
      });
    }

    // DOCUMENTS
    if (documentsTemplate.length > 0) {
      await this.prisma.document.createMany({
        data: documentsTemplate.map((doc) => ({
          organizationId: data.organizationId,
          caseId: newCase.id,
          name: doc,
          type: 'template',
        })),
      });
    }

    return newCase;
  }
}
