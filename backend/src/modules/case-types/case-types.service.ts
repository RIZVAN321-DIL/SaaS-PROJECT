import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseTypesService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CRUD: CREATE CASE TYPE
  // =========================
  async create(data: {
    organizationId: string;
    name: string;
    description?: string;
  }) {
    return this.prisma.caseType.create({
      data,
    });
  }

  // =========================
  // CRUD: GET ALL
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.caseType.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    });
  }

  // =========================
  // CRUD: GET ONE
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

    return caseType;
  }

  // =========================
  // CRUD: UPDATE
  // =========================
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ) {
    return this.prisma.caseType.update({
      where: { id },
      data,
    });
  }

  // =========================
  // CRUD: DELETE
  // =========================
  async remove(id: string) {
    return this.prisma.caseType.delete({
      where: { id },
    });
  }

  // ======================================================
  // 🧠 CASE TYPE ENGINE: CREATE CASE FROM TEMPLATE
  // ======================================================
  async createCaseFromType(data: {
    caseTypeId: string;
    organizationId: string;
    clientId: string;
    title: string;
    description?: string;
  }) {
    // 1. Получаем шаблон CaseType
    const caseType = await this.prisma.caseType.findUnique({
      where: { id: data.caseTypeId },
    });

    if (!caseType) {
      throw new NotFoundException('CaseType not found');
    }

    // 2. Создаём Case
    const newCase = await this.prisma.case.create({
      data: {
        organizationId: data.organizationId,
        clientId: data.clientId,
        caseTypeId: data.caseTypeId,
        title: data.title,
        description: data.description,
      },
    });

    // 3. Автоматическое создание задач
    await this.prisma.task.createMany({
      data: [
        {
          organizationId: data.organizationId,
          caseId: newCase.id,
          title: `Подготовить документы для ${caseType.name}`,
        },
        {
          organizationId: data.organizationId,
          caseId: newCase.id,
          title: `Проверить данные клиента`,
        },
        {
          organizationId: data.organizationId,
          caseId: newCase.id,
          title: `Назначить ответственного юриста`,
        },
      ],
    });

    // 4. Автоматическое создание документов
    await this.prisma.document.createMany({
      data: [
        {
          organizationId: data.organizationId,
          caseId: newCase.id,
          name: `Заявление - ${caseType.name}`,
          type: 'template',
        },
        {
          organizationId: data.organizationId,
          caseId: newCase.id,
          name: `Сопроводительные документы`,
          type: 'template',
        },
      ],
    });

    return newCase;
  }
}
