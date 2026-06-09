import { Injectable, NotFoundException } from '@nestjs/common';
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
    const firstStage = await this.prisma.caseStage.findFirst({
      where: { organizationId: data.organizationId },
      orderBy: { order: 'asc' },
    });

    const newCase = await this.prisma.case.create({
      data: {
        clientId: data.clientId,
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        caseTypeId: data.caseTypeId,
        stageId: firstStage?.id ?? null,
      },
    });

    await this.audit.log({
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'CASE_CREATED',
      entity: 'Case',
      entityId: newCase.id,
      meta: {
        title: data.title,
        clientId: data.clientId,
      },
    });

    return newCase;
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
        stage: true,
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
        stage: true,
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
      stageId?: string;
      organizationId: string;
      userId: string;
    },
  ) {
    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        caseTypeId: data.caseTypeId,
        stageId: data.stageId,
      },
    });

    await this.audit.log({
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'CASE_UPDATED',
      entity: 'Case',
      entityId: id,
      meta: data,
    });

    return updated;
  }

  // =========================
  // DELETE CASE
  // =========================
  async remove(id: string, organizationId: string, userId: string) {
    const deleted = await this.prisma.case.delete({
      where: { id },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: 'CASE_DELETED',
      entity: 'Case',
      entityId: id,
    });

    return deleted;
  }

  // =========================
  // KANBAN BOARD
  // =========================
  async getBoard(organizationId: string) {
    return this.prisma.caseStage.findMany({
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
  }

  // =========================
  // MOVE CASE
  // =========================
  async moveCase(caseId: string, stageId: string, organizationId: string, userId: string) {
    const stage = await this.prisma.caseStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: { stageId },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: 'CASE_MOVED_STAGE',
      entity: 'Case',
      entityId: caseId,
      meta: { stageId },
    });

    return updated;
  }
}
