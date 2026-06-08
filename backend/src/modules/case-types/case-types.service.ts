import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseTypesService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CREATE CASE TYPE (WITH TEMPLATES)
  // =========================
  async create(data: {
    organizationId: string;
    name: string;
    description?: string;

    // 🧠 NEW: JSON templates
    tasksTemplate?: string[]; // ["task 1", "task 2"]
    documentsTemplate?: string[]; // ["doc 1", "doc 2"]
  }) {
    return this.prisma.caseType.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,

        // store as JSON string (safe for Prisma without schema change)
        tasksTemplate: JSON.stringify(data.tasksTemplate || []),
        documentsTemplate: JSON.stringify(data.documentsTemplate || []),
      },
    });
  }

  // =========================
  // GET ALL
  // =========================
  async findAll(organizationId: string) {
    const types = await this.prisma.caseType.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    });

    // parse templates back to JSON
    return types.map((t) => ({
      ...t,
      tasksTemplate: JSON.parse((t as any).tasksTemplate || '[]'),
      documentsTemplate: JSON.parse((t as any).documentsTemplate || '[]'),
    }));
  }

  // =========================
  // GET ONE
  // =========================
  async findById(id: string) {
    const caseType = await this.prisma.caseType.findUnique({
      where: { id },
      include: {
        cases: true,
      },
    });

    if (!caseType) {
      throw new NotFoundException('CaseType not found');
    }

    return {
      ...caseType,
      tasksTemplate: JSON.parse((caseType as any).tasksTemplate || '[]'),
      documentsTemplate: JSON.parse((caseType as any).documentsTemplate || '[]'),
    };
  }

  // =========================
  // UPDATE
  // =========================
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      tasksTemplate?: string[];
      documentsTemplate?: string[];
    },
  ) {
    return this.prisma.caseType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        tasksTemplate: data.tasksTemplate
          ? JSON.stringify(data.tasksTemplate)
          : undefined,
        documentsTemplate: data.documentsTemplate
          ? JSON.stringify(data.documentsTemplate)
          : undefined,
      },
    });
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string) {
    return this.prisma.caseType.delete({
      where: { id },
    });
  }

  // ======================================================
  // 🧠 ENGINE: CREATE CASE FROM TEMPLATE
  // ======================================================
  async createCaseFromType(data: {
    caseTypeId: string;
    organizationId: string;
    clientId: string;
    title: string;
    description?: string;
  }) {
    // 1. Get CaseType
    const caseType = await this.prisma.caseType.findUnique({
      where: { id: data.caseTypeId },
    });

    if (!caseType) {
      throw new NotFoundException('CaseType not found');
    }

    const tasksTemplate: string[] = JSON.parse(
      (caseType as any).tasksTemplate || '[]',
    );

    const documentsTemplate: string[] = JSON.parse(
      (caseType as any).documentsTemplate || '[]',
    );

    // 2. Create Case
    const newCase = await this.prisma.case.create({
      data: {
        organizationId: data.organizationId,
        clientId: data.clientId,
        caseTypeId: data.caseTypeId,
        title: data.title,
        description: data.description,
      },
    });

    // 3. Generate Tasks from template
    if (tasksTemplate.length > 0) {
      await this.prisma.task.createMany({
        data: tasksTemplate.map((task) => ({
          organizationId: data.organizationId,
          caseId: newCase.id,
          title: task,
        })),
      });
    }

    // 4. Generate Documents from template
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
