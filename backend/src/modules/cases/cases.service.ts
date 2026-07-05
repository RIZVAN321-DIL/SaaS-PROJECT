import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CaseStageService } from '../case-stage/case-stage.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
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
    private readonly caseStages: CaseStageService,
    private readonly customFields: CustomFieldsService,
  ) {}

  async create(data: {
    clientId: string;
    organizationId: string;
    title: string;
    description?: string;
    caseTypeId?: string;
    assignedLawyerId?: string;
    customFields?: Record<string, any>;
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

    // Первая стадия эффективной воронки: своя воронка типа дела,
    // если задана, иначе — дефолтная воронка организации.
    const firstStage = await this.caseStages.getFirstEffectiveStage(
      data.organizationId,
      data.caseTypeId,
    );

    const cleanedCustomFields = await this.customFields.validateValues(
      data.organizationId,
      'CASE',
      data.caseTypeId,
      data.customFields,
    );

    const newCase = await this.prisma.case.create({
      data: {
        clientId: data.clientId,
        organizationId: data.organizationId,
        title: data.title.trim(),
        description: data.description?.trim(),
        caseTypeId: data.caseTypeId,
        stageId: firstStage?.id ?? null,
        assignedLawyerId: data.assignedLawyerId || null,
        customFields: cleanedCustomFields,
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
    customFields?: Record<string, any>;
    organizationId: string;
    userId: string;
  }) {
    const existingCase = await this.findById(id, data.organizationId);

    const effectiveCaseTypeId =
      data.caseTypeId !== undefined ? data.caseTypeId : existingCase.caseTypeId ?? undefined;

    if (data.caseTypeId) {
      const caseType = await this.prisma.caseType.findFirst({
        where: { id: data.caseTypeId, organizationId: data.organizationId },
      });
      if (!caseType) throw new NotFoundException('Тип дела не найден');
    }

    let stageId = data.stageId;

    if (data.stageId) {
      // Стадия должна принадлежать эффективной воронке итогового типа дела.
      const effectiveStages = await this.caseStages.getEffectiveStages(
        data.organizationId,
        effectiveCaseTypeId,
      );
      if (!effectiveStages.some((s) => s.id === data.stageId)) {
        throw new BadRequestException(
          'Эта стадия не относится к воронке выбранного типа дела',
        );
      }
    } else if (
      data.caseTypeId !== undefined &&
      data.caseTypeId !== existingCase.caseTypeId
    ) {
      // Тип дела сменился, а стадию явно не передали — переносим дело
      // на первую стадию воронки нового типа, чтобы не остаться "подвисшим"
      // на стадии из чужой воронки.
      const firstStage = await this.caseStages.getFirstEffectiveStage(
        data.organizationId,
        data.caseTypeId,
      );
      stageId = firstStage?.id ?? undefined;
    }

    let customFields: Record<string, any> | undefined;
    if (data.customFields !== undefined) {
      customFields = await this.customFields.validateValues(
        data.organizationId,
        'CASE',
        effectiveCaseTypeId,
        {
          ...((existingCase.customFields as Record<string, any>) ?? {}),
          ...data.customFields,
        },
      );
    }

    const updateData: Record<string, unknown> = {
      title: data.title?.trim(),
      description: data.description?.trim(),
      caseTypeId: data.caseTypeId,
      stageId,
    };

    if (data.assignedLawyerId !== undefined) {
      updateData.assignedLawyerId = data.assignedLawyerId || null;
    }

    if (customFields !== undefined) {
      updateData.customFields = customFields;
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

  async getBoard(organizationId: string, requester?: Requester, caseTypeId?: string) {
    if (caseTypeId) {
      const stages = await this.caseStages.getEffectiveStages(organizationId, caseTypeId);

      const where: Record<string, unknown> = { organizationId, caseTypeId };
      if (requester) {
        const settings = await this.permissions.getForOrganization(organizationId);
        if (settings?.lawyersSeeOnlyOwnCases && requester.role === Role.LAWYER) {
          where.OR = [
            { assignedLawyerId: requester.userId },
            { assignedLawyerId: null },
          ];
        }
      }

      const cases = await this.prisma.case.findMany({
        where,
        include: { client: true, caseType: true, stage: true },
        orderBy: { createdAt: 'desc' },
      });

      return stages.map((stage) => ({
        ...stage,
        cases: cases.filter((c) => c.stageId === stage.id),
      }));
    }

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
      where: { organizationId, caseTypeId: null },
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

    const effectiveStages = await this.caseStages.getEffectiveStages(
      organizationId,
      existingCase.caseTypeId,
    );

    if (!effectiveStages.some((s) => s.id === stageId)) {
      throw new BadRequestException(
        'Эта стадия не относится к воронке типа дела, к которому привязано дело',
      );
    }

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
