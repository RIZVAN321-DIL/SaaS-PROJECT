import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  CreateCustomFieldDefinitionDto,
  UpdateCustomFieldDefinitionDto,
  EntityType,
} from './dto/custom-field-definition.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // GET ALL (с фильтрами)
  // entityType — обязателен для фронта (форма клиента или форма дела).
  // caseTypeId — если передан для entityType=CASE, возвращаем поля,
  // общие для всех типов (caseTypeId=null) + поля именно этого типа.
  // =========================
  async findAll(
    organizationId: string,
    entityType?: EntityType,
    caseTypeId?: string,
  ) {
    if (entityType === 'CASE' && caseTypeId) {
      return this.prisma.customFieldDefinition.findMany({
        where: {
          organizationId,
          entityType: 'CASE',
          OR: [{ caseTypeId: null }, { caseTypeId }],
        },
        orderBy: { order: 'asc' },
      });
    }

    return this.prisma.customFieldDefinition.findMany({
      where: {
        organizationId,
        ...(entityType ? { entityType } : {}),
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const def = await this.prisma.customFieldDefinition.findFirst({
      where: { id, organizationId },
    });

    if (!def) {
      throw new NotFoundException('Настраиваемое поле не найдено');
    }

    return def;
  }

  // =========================
  // CREATE
  // =========================
  async create(data: CreateCustomFieldDefinitionDto & { organizationId: string }) {
    if (data.entityType === 'CLIENT' && data.caseTypeId) {
      throw new BadRequestException(
        'caseTypeId применим только к полям карточки дела (entityType = CASE)',
      );
    }

    if (data.fieldType === 'SELECT' && (!data.options || data.options.length === 0)) {
      throw new BadRequestException('Для типа "Список" нужно указать варианты выбора');
    }

    if (data.caseTypeId) {
      const caseType = await this.prisma.caseType.findFirst({
        where: { id: data.caseTypeId, organizationId: data.organizationId },
      });
      if (!caseType) {
        throw new NotFoundException('Тип дела не найден');
      }
    }

    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: {
        organizationId: data.organizationId,
        entityType: data.entityType,
        key: data.key,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Поле с ключом "${data.key}" уже существует для этого типа карточки`,
      );
    }

    return this.prisma.customFieldDefinition.create({
      data: {
        organizationId: data.organizationId,
        entityType: data.entityType,
        key: data.key,
        label: data.label,
        fieldType: data.fieldType ?? 'TEXT',
        options: data.options ?? undefined,
        required: data.required ?? false,
        order: data.order ?? 0,
        caseTypeId: data.entityType === 'CASE' ? data.caseTypeId ?? null : null,
      },
    });
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, organizationId: string, data: UpdateCustomFieldDefinitionDto) {
    const def = await this.findOne(id, organizationId);

    if (data.fieldType === 'SELECT' && !data.options && !Array.isArray(def.options)) {
      throw new BadRequestException('Для типа "Список" нужно указать варианты выбора');
    }

    if (data.caseTypeId && def.entityType !== 'CASE') {
      throw new BadRequestException(
        'caseTypeId применим только к полям карточки дела (entityType = CASE)',
      );
    }

    if (data.caseTypeId) {
      const caseType = await this.prisma.caseType.findFirst({
        where: { id: data.caseTypeId, organizationId },
      });
      if (!caseType) {
        throw new NotFoundException('Тип дела не найден');
      }
    }

    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.fieldType !== undefined ? { fieldType: data.fieldType } : {}),
        ...(data.options !== undefined ? { options: data.options } : {}),
        ...(data.required !== undefined ? { required: data.required } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.caseTypeId !== undefined ? { caseTypeId: data.caseTypeId } : {}),
      },
    });
  }

  // =========================
  // REMOVE
  // Значения по этому ключу, уже сохранённые в карточках, намеренно не трогаем —
  // они просто перестанут отображаться и редактироваться через UI.
  // =========================
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.customFieldDefinition.delete({ where: { id } });
    return { success: true, id };
  }

  // =========================
  // Валидация значений customFields перед сохранением клиента/дела.
  // Проверяет: неизвестные ключи отбрасываются, обязательные поля заполнены,
  // SELECT-значения входят в список options.
  // =========================
  async validateValues(
    organizationId: string,
    entityType: EntityType,
    caseTypeId: string | undefined | null,
    values: Record<string, any> | undefined | null,
  ): Promise<Record<string, any>> {
    const definitions = await this.findAll(
      organizationId,
      entityType,
      caseTypeId ?? undefined,
    );

    const allowedKeys = new Set(definitions.map((d) => d.key));
    const cleaned: Record<string, any> = {};

    for (const def of definitions) {
      const raw = values?.[def.key];

      if (def.required && (raw === undefined || raw === null || raw === '')) {
        throw new BadRequestException(`Поле "${def.label}" обязательно для заполнения`);
      }

      if (
        def.fieldType === 'SELECT' &&
        raw !== undefined &&
        raw !== null &&
        raw !== '' &&
        Array.isArray(def.options) &&
        !(def.options as string[]).includes(String(raw))
      ) {
        throw new BadRequestException(
          `Недопустимое значение для поля "${def.label}"`,
        );
      }

      if (raw !== undefined) {
        cleaned[def.key] = raw;
      }
    }

    // Сохраняем и значения по ключам, для которых сейчас нет определения
    // (например, поле только что удалили) — чтобы не терять историчные данные молча.
    if (values) {
      for (const key of Object.keys(values)) {
        if (!allowedKeys.has(key) && values[key] !== undefined) {
          cleaned[key] = values[key];
        }
      }
    }

    return cleaned;
  }
        }
