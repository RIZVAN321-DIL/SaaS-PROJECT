import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CREATE CASE
  // =========================
  async create(data: {
    clientId: string;
    organizationId: string;
    title: string;
    description?: string;
    caseTypeId?: string;
  }) {
    // 🔥 получить первую стадию (order ASC)
    const firstStage = await this.prisma.caseStage.findFirst({
      where: { organizationId: data.organizationId },
      orderBy: { order: 'asc' },
    });

    return this.prisma.case.create({
      data: {
        ...data,
        stageId: firstStage?.id ?? null, // авто-назначение стадии
      },
    });
  }

  // =========================
  // GET ALL CASES
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.case.findMany({
      where: { organizationId },
      include: {
        client: true,
        caseType: true,
        stage: true, // 🔥 добавили stage
      },
    });
  }

  // =========================
  // GET ONE CASE
  // =========================
  async findById(id: string) {
    const caseItem = await this.prisma.case.findUnique({
      where: { id },
      include: {
        client: true,
        caseType: true,
        stage: true, // 🔥 добавили stage
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Case not found');
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
      stageId?: string; // 🔥 можно менять стадию через update
    },
  ) {
    return this.prisma.case.update({
      where: { id },
      data,
    });
  }

  // =========================
  // DELETE CASE
  // =========================
  async remove(id: string) {
    return this.prisma.case.delete({
      where: { id },
    });
  }

  // =========================
  // KANBAN BOARD
  // =========================
  async getBoard(organizationId: string) {
    const stages = await this.prisma.caseStage.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
      include: {
        cases: {
          include: {
            client: true,
            caseType: true,
            stage: true,
          },
        },
      },
    });

    return stages;
  }

  // =========================
  // MOVE CASE (DRAG & DROP)
  // =========================
  async moveCase(caseId: string, stageId: string) {
    const stage = await this.prisma.caseStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        stageId,
      },
    });
  }
}
