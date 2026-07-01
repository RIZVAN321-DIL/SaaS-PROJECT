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

  async findAll(organizationId: string) {
    return this.prisma.caseStage.findMany({
      where: { organizationId },
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
  // Если стадия с таким order уже существует — сдвигаем все стадии
  // с order >= запрошенного на +1, затем вставляем новую.
  // Всё в одной транзакции, чтобы не нарушить уникальный индекс
  // [organizationId, order] в момент сдвига.
  // =========================
  async create(data: {
    name: string;
    order: number;
    color?: string;
    organizationId: string;
  }) {
    const conflict = await this.prisma.caseStage.findFirst({
      where: {
        organizationId: data.organizationId,
        order: data.order,
      },
    });

    return this.prisma.$transaction(async (tx) => {
      if (conflict) {
        // Сдвигаем все стадии с order >= нового order на +1.
        // Обновляем в порядке убывания, чтобы не нарушить уникальность
        // в промежуточных состояниях.
        const stagesToShift = await tx.caseStage.findMany({
          where: {
            organizationId: data.organizationId,
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
        },
      });
    });
  }

  // =========================
  // UPDATE (название и/или цвет)
  // Изменение order через этот метод намеренно не поддерживается —
  // для перестановки стадий используется отдельный reorder-эндпоинт.
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
  // чтобы не потерять дела. Затем сдвигаем оставшиеся стадии так, чтобы
  // в последовательности не было дырок (gap-free).
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

      // 3. Уплотнить оставшиеся стадии: сдвинуть те, что были после удалённой
      const laterStages = await tx.caseStage.findMany({
        where: {
          organizationId,
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
  // =========================
  async moveCase(
    caseId: string,
    stageId: string,
    organizationId: string,
  ) {
    const stage = await this.prisma.caseStage.findFirst({
      where: { id: stageId, organizationId },
    });

    if (!stage) {
      throw new NotFoundException('Стадия не найдена');
    }

    const caseItem = await this.prisma.case.findFirst({
      where: { id: caseId, organizationId },
    });

    if (!caseItem) {
      throw new NotFoundException('Дело не найдено');
    }

    return this.prisma.case.update({
      where: { id: caseId },
      data: { stageId },
    });
  }

  // =========================
  // GET BOARD
  // =========================
  async getBoard(organizationId: string) {
    return this.prisma.caseStage.findMany({
      where: { organizationId },
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
  }
}
