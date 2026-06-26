import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CREATE
  // =========================
  async create(data: {
    organizationId: string;
    fullName: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) {
    return this.prisma.client.create({
      data: {
        organizationId: data.organizationId,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        notes: data.notes,
      },
    });
  }

  // =========================
  // GET ALL (с пагинацией)
  // =========================
  async findAll(
    organizationId: string,
    page = 1,
    limit = DEFAULT_LIMIT,
  ) {
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const skip = (Math.max(page, 1) - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where: { organizationId },
        include: {
          cases: {
            select: {
              id: true,
              title: true,
              stageId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.client.count({ where: { organizationId } }),
    ]);

    return {
      items,
      total,
      page: Math.max(page, 1),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // =========================
  // GET ONE
  // =========================
  async findById(id: string, organizationId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
      include: {
        cases: {
          select: {
            id: true,
            title: true,
            description: true,
            stageId: true,
            caseTypeId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    return client;
  }

  // =========================
  // UPDATE
  // =========================
  async update(
    id: string,
    organizationId: string,
    data: {
      fullName?: string;
      phone?: string;
      email?: string;
      notes?: string;
    },
  ) {
    await this.findById(id, organizationId);

    return this.prisma.client.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && {
          fullName: data.fullName.trim(),
        }),
        ...(data.phone !== undefined && {
          phone: data.phone?.trim() || null,
        }),
        ...(data.email !== undefined && {
          email: data.email?.trim().toLowerCase() || null,
        }),
        ...(data.notes !== undefined && {
          notes: data.notes,
        }),
      },
    });
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.prisma.client.delete({ where: { id } });
  }
}
