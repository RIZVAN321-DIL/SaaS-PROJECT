import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../permissions/permissions.service';
import { Role } from '../../common/enums/role.enum';

interface Requester {
  userId: string;
  role: Role | string;
}

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly permissions: PermissionsService,
  ) {}

  async create(data: {
    clientId: string;
    organizationId: string;
    title: string;
    description?: string;
    caseTypeId?: string;
    assignedLawyerId?: string;
    userId: string;
  }) {
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, organizationId: data.organizationId },
    });
    if (!client) throw new NotFoundException('Клиент не найден');

    if (data.caseTypeId) {
      const caseType = await this.prisma.caseType.findFirst({
        where: { id: data.caseTypeId, organizationId: data.organizationId },
      });
      if (!caseType) throw new NotFoundException('Тип дела не найден');
    }

    const firstStage = await this.prisma.caseStage.findFirst({
      where: { organizationId: data.organizationId },
      orderBy: { order: 'asc' },
    });

    const newCase = await this.prisma.case.create({
      data: {
        clientId: data.clientId,
        organizationId: data.organizationId,
        title: data.title.trim(),
        description: data.description?.trim(),
        caseTypeId: data.caseTypeId,
        stageId: firstStage?.id ?? null,
        assignedLawyerId: data.assignedLawyerId || null,
      },
      include: { client: true, caseType: true, stage: true },
    });

    await this.audit.log({
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'CASE_CREATED',
      entity: 'Case',
      entityId: newCase.id,
      meta: { title: newCase.title, clientId: data.clientId, caseTypeId: data.caseTypeId },
    });

    return newCase;
  }

  async findAll(organizationId: string, requester?: Requester) {
    const where: Record<string, unknown> = { organizationId };

    if (requester) {
      const settings = await this.permissions.getForOrganization(organizationId);
      if (
        settings?.lawyersSeeOnlyOwnCases &&
        requester.role === Role.LAWYER
      ) {
        where.OR = [
          { assignedLawyerId: requester.userId },
          { assignedLawyerId: null },
        ];
      }
    }

    return this.prisma.case.findMany({
      where,
      include: {
        client: true,
        caseType: true,
        stage: true,
        tasks: { select: { id: true, status: true, dueDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string, requester?: Requester) {
    const caseItem = await this.prisma.case.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        caseType: true,
        stage: true,
        tasks: true,
        documents: true,
        assignedLawyer: { select: { id: true, email: true } },
      },
    });

    if (!caseItem) throw new NotFoundException('Дело не найдено');
    return caseItem;
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    caseTypeId?: string;
    stageId?: string;
    assignedLawyerId?: string | null;
    organizationId: string;
    userId: string;
  }) {
    const existingCase = await this.findById(id, data.organizationId);

    if (data.caseTypeId) {
      const caseType = await this.prisma.caseType.findFirst({
        where: { id: data.caseTypeId, organizationId: data.organizationId },
      });
      if (!caseType) throw new NotFoundException('Тип дела не найден');
    }

    if (data.stageId) {
      const stage = await this.prisma.caseStage.findFirst({
        where: { id: data.stageId, organizationId: data.organizationId },
      });
      if (!stage) throw new NotFoundException('Стадия не найдена');
    }

    const updateData: Record<string, unknown> = {
      title: data.title?.trim(),
      description: data.description?.trim(),
      caseTypeId: data.caseTypeId,
      stageId: data.stageId,
    };

    if (data.assignedLawyerId !== undefined) {
      updateData.assignedLawyerId = data.assignedLawyerId || null;
    }

    const updated = await this.prisma.case.update({
      where: { id },
      data: updateData,
      include: { client: true, caseType: true, stage: true },
    });

    await this.audit.log({
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'CASE_UPDATED',
      entity: 'Case',
      entityId: id,
      meta: {
        before: {
          title: existingCase.title,
          description: existingCase.description,
          caseTypeId: existingCase.caseTypeId,
          stageId: existingCase.stageId,
        },
        after: {
          title: updated.title,
          description: updated.description,
          caseTypeId: updated.caseTypeId,
          stageId: updated.stageId,
        },
      },
    });

    return updated;
  }

  // =========================
  // SET DEADLINE (фиксированная дата ИЛИ авторасчёт от даты события + N дней)
  // =========================
  async setDeadline(
    id: string,
    data: {
      label?: string;
      fixedDate?: string;
      sourceDate?: string;
      days?: number;
      organizationId: string;
      userId: string;
    },
  ) {
    await this.findById(id, data.organizationId);

    let deadlineDate: Date | null = null;
    let deadlineSourceDate: Date | null = null;
    let deadlineDays: number | null = null;

    if (data.fixedDate) {
      // Режим 1: фиксированная дата
      deadlineDate = new Date(data.fixedDate);
    } else if (data.sourceDate && data.days !== undefined) {
      // Режим 2: авторасчёт от даты события
      deadlineSourceDate = new Date(data.sourceDate);
      deadlineDays = data.days;
      deadlineDate = new Date(deadlineSourceDate);
      deadlineDate.setDate(deadlineDate.getDate() + data.days);
    }
    // Если ни то, ни другое не передано — deadlineDate остаётся null (срок снят)

    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        deadlineLabel: data.label?.trim() || null,
        deadlineDate,
        deadlineSourceDate,
        deadlineDays,
        // При изменении срока сбрасываем отметку об отправленном напоминании,
        // чтобы система напомнила заново про новый дедлайн.
        deadlineReminderSentAt: null,
      },
    });

    await this.audit.log({
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'CASE_DEADLINE_SET',
      entity: 'Case',
      entityId: id,
      meta: { deadlineDate, deadlineLabel: data.label },
    });

    return updated;
  }

  async remove(id: string, organizationId: string, userId: string, requesterRole?: Role | string) {
    if (requesterRole) {
      const settings = await this.permissions.getForOrganization(organizationId);
      if (
        settings?.whoCanDeleteCases === 'OWNER' &&
        requesterRole !== Role.OWNER
      ) {
        throw new ForbiddenException('Только владелец организации может удалять дела');
      }
    }

    const existingCase = await this.findById(id, organizationId);

    const [tasksCount, documentsCount] = await Promise.all([
      this.prisma.task.count({ where: { caseId: id, organizationId } }),
      this.prisma.document.count({ where: { caseId: id, organizationId } }),
    ]);

    if (tasksCount > 0 || documentsCount > 0) {
      const parts: string[] = [];
      if (tasksCount > 0) parts.push(`задач: ${tasksCount}`);
      if (documentsCount > 0) parts.push(`документов: ${documentsCount}`);
      throw new BadRequestException(
        `Нельзя удалить дело, пока к нему привязаны ${parts.join(' и ')}. Удалите их сначала.`,
      );
    }

    const deleted = await this.prisma.case.delete({ where: { id } });

    await this.audit.log({
      organizationId,
      userId,
      action: 'CASE_DELETED',
      entity: 'Case',
      entityId: id,
      meta: { title: existingCase.title },
    });

    return deleted;
  }

  async getBoard(organizationId: string, requester?: Requester) {
    const where: Record<string, unknown> = { organizationId };

    if (requester) {
      const settings = await this.permissions.getForOrganization(organizationId);
      if (
        settings?.lawyersSeeOnlyOwnCases &&
        requester.role === Role.LAWYER
      ) {
        where.OR = [
          { assignedLawyerId: requester.userId },
          { assignedLawyerId: null },
        ];
      }
    }

    return this.prisma.caseStage.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
      include: {
        cases: {
          where,
          include: { client: true, caseType: true, stage: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async moveCase(caseId: string, stageId: string, organizationId: string, userId: string) {
    const existingCase = await this.findById(caseId, organizationId);

    const stage = await this.prisma.caseStage.findFirst({
      where: { id: stageId, organizationId },
    });
    if (!stage) throw new NotFoundException('Стадия не найдена');

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: { stageId },
      include: { client: true, caseType: true, stage: true },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: 'CASE_MOVED_STAGE',
      entity: 'Case',
      entityId: caseId,
      meta: { fromStageId: existingCase.stageId, toStageId: stageId },
    });

    return updated;
  }
  }
