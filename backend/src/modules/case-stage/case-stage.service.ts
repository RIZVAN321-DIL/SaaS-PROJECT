import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseStageService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // EFFECTIVE STAGES
  // Если для типа дела заданы свои стадии — возвращаем их.
  // Если нет (или caseTypeId не передан) — возвращаем дефолтные стадии
  // организации (caseTypeId = null). Это и есть "воронка по умолчанию"
  // из требования: "если для типа дела не задана своя воронка — используется общая".
  // =========================
  async getEffectiveStages(organizationId: string, caseTypeId?: string | null) {
    if (caseTypeId) {
      const ownStages = await this.prisma.caseStage.findMany({
        where: { organizationId, caseTypeId },
        orderBy: { order: 'asc' },
      });

      if (ownStages.length > 0) {
        return ownStages;
      }
    }

    return this.prisma.caseStage.findMany({
      where: { organizationId, caseTypeId: null },
      orderBy: { order: 'asc' },
    });
  }

  async getFirstEffectiveStage(organizationId: string, caseTypeId?: string | null) {
    const stages = await this.getEffectiveStages(organizationId, caseTypeId);
    return stages[0] ?? null;
  }

  // =========================
  // GET ALL
  // Без caseTypeId — дефолтные стадии организации (обратная совместимость).
  // С caseTypeId — эффективная воронка для этого типа дела (см. выше).
  // =========================
  async findAll(organizationId: string, caseTypeId?: string) {
    if (caseTypeId !== undefined) {
      return this.getEffectiveStages(organizationId, caseTypeId);
    }

    return this.prisma.caseStage.findMany({
      where: { organizationId, caseTypeId: null },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const stage = await this.prisma.caseStage.findFirst({
      where: { id, organizationId },
    });

    if (!stage) {
      throw new NotFoundException('Стадия не найдена');
    }

    return stage;
  }

  // =========================
  // CREATE
  // Если стадия с таким order в той же группе (organizationId, caseTypeId)
  // уже существует — сдвигаем все стадии этой группы с order >= запрошенного
  // на +1, затем вставляем новую. Всё в одной транзакции.
  // caseTypeId = undefined/null → стадия дефолтной (общей) воронки организации.
  // =========================
  async create(data: {
    name: string;
    order: number;
    color?: string;
    organizationId: string;
    caseTypeId?: string | null;
  }) {
    const caseTypeId = data.caseTypeId ?? null;

    if (caseTypeId) {
      const caseType = await this.prisma.caseType.findFirst({
        where: { id: caseTypeId, organizationId: data.organizationId },
      });
      if (!caseType) {
        throw new NotFoundException('Тип дела не найден');
      }
    }

    const conflict = await this.prisma.caseStage.findFirst({
      where: {
        organizationId: data.organizationId,
        caseTypeId,
        order: data.order,
      },
    });

    return this.prisma.$transaction(async (tx) => {
      if (conflict) {
        // Сдвигаем все стадии этой же группы с order >= нового order на +1.
        // Обновляем в порядке убывания, чтобы не нарушить уникальность
        // в промежуточных состояниях.
        const stagesToShift = await tx.caseStage.findMany({
          where: {
            organizationId: data.organizationId,
            caseTypeId,
            order: { gte: data.order },
          },
          orderBy: { order: 'desc' },
        });

        for (const s of stagesToShift) {
          await tx.caseStage.update({
            where: { id: s.id },
            data: { order: s.order + 1 },
          });
        }
      }

      return tx.caseStage.create({
        data: {
          name: data.name,
          order: data.order,
          color: data.color ?? '#3B82F6',
          organizationId: data.organizationId,
          caseTypeId,
        },
      });
    });
  }

  // =========================
  // UPDATE (название и/или цвет)
  // Изменение order и caseTypeId через этот метод намеренно не поддерживается —
  // для перестановки стадий используется отдельный reorder-эндпоинт, а перенос
  // стадии между воронками не предусмотрен (удалите и создайте заново в нужной).
  // =========================
  async update(
    id: string,
    organizationId: string,
    data: { name?: string; color?: string },
  ) {
    const stage = await this.prisma.caseStage.findFirst({
      where: { id, organizationId },
    });

    if (!stage) {
      throw new NotFoundException('Стадия не найдена');
    }

    return this.prisma.caseStage.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
      },
    });
  }

  // =========================
  // REMOVE
  // Перед удалением снимаем привязку всех дел к этой стадии (stageId → null),
  // чтобы не потерять дела. Затем сдвигаем оставшиеся стадии ЭТОЙ ЖЕ ГРУППЫ
  // (organizationId, caseTypeId) так, чтобы в последовательности не было дырок.
  // =========================
  async remove(id: string, organizationId: string) {
    const stage = await this.prisma.caseStage.findFirst({
      where: { id, organizationId },
    });

    if (!stage) {
      throw new NotFoundException('Стадия не найдена');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Снять привязку дел (не удалять их)
      await tx.case.updateMany({
        where: { stageId: id, organizationId },
        data: { stageId: null },
      });

      // 2. Удалить стадию
      await tx.caseStage.delete({ where: { id } });

      // 3. Уплотнить оставшиеся стадии той же группы: сдвинуть те, что были после удалённой
      const laterStages = await tx.caseStage.findMany({
        where: {
          organizationId,
          caseTypeId: stage.caseTypeId,
          order: { gt: stage.order },
        },
        orderBy: { order: 'asc' },
      });

      for (const s of laterStages) {
        await tx.caseStage.update({
          where: { id: s.id },
          data: { order: s.order - 1 },
        });
      }

      return { success: true, deletedId: id, affectedCases: 'unlinked' };
    });
  }

  // =========================
  // MOVE CASE (drag-and-drop на канбан-доске)
  // Стадия должна принадлежать эффективной воронке типа дела, к которому
  // относится это дело (собственной воронке типа, либо дефолтной, если
  // у типа своей воронки нет).
  // =========================
  async moveCase(
    caseId: string,
    stageId: string,
    organizationId: string,
  ) {
    const caseItem = await this.prisma.case.findFirst({
      where: { id: caseId, organizationId },
    });

    if (!caseItem) {
      throw new NotFoundException('Дело не найдено');
    }

    const effectiveStages = await this.getEffectiveStages(
      organizationId,
      caseItem.caseTypeId,
    );

    const stage = effectiveStages.find((s) => s.id === stageId);

    if (!stage) {
      throw new BadRequestException(
        'Эта стадия не относится к воронке типа дела, к которому привязано дело',
      );
    }

    return this.prisma.case.update({
      where: { id: caseId },
      data: { stageId },
    });
  }

  // =========================
  // GET BOARD
  // Без caseTypeId — общая доска: дефолтные стадии + все дела, стоящие на
  // одной из них (то есть дела типов без собственной воронки, плюс дела
  // без типа вообще).
  // С caseTypeId — доска конкретного типа дела: его эффективная воронка
  // (своя или дефолтная) и только дела этого типа.
  // =========================
  async getBoard(organizationId: string, caseTypeId?: string) {
    if (caseTypeId) {
      const stages = await this.getEffectiveStages(organizationId, caseTypeId);

      const cases = await this.prisma.case.findMany({
        where: { organizationId, caseTypeId },
        include: { client: true, caseType: true, stage: true },
        orderBy: { createdAt: 'desc' },
      });

      return stages.map((stage) => ({
        ...stage,
        cases: cases.filter((c) => c.stageId === stage.id),
      }));
    }

    const defaultStages = await this.prisma.caseStage.findMany({
      where: { organizationId, caseTypeId: null },
      orderBy: { order: 'asc' },
      include: {
        cases: {
          where: { organizationId },
          include: {
            client: true,
            caseType: true,
            stage: true,
          },
        },
      },
    });

    return defaultStages;
  }
      }
