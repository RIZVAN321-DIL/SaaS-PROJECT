import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async search(organizationId: string, query: string) {
    const q = query?.trim();

    if (!q || q.length < 2) {
      return {
        query: q,
        clients: [],
        cases: [],
        tasks: [],
        total: { clients: 0, cases: 0, tasks: 0 },
      };
    }

    const [clients, cases, tasks] = await Promise.all([
      // =========================
      // КЛИЕНТЫ
      // =========================
      this.prisma.client.findMany({
        where: {
          organizationId,
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),

      // =========================
      // ДЕЛА
      // =========================
      this.prisma.case.findMany({
        where: {
          organizationId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          client: { select: { id: true, fullName: true } },
          caseType: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true, color: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),

      // =========================
      // ЗАДАЧИ (UX-8: добавлены)
      // =========================
      this.prisma.task.findMany({
        where: {
          organizationId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          case: { select: { id: true, title: true } },
          assignedTo: { select: { id: true, email: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      query: q,
      clients,
      cases,
      tasks,
      total: {
        clients: clients.length,
        cases: cases.length,
        tasks: tasks.length,
      },
    };
  }
}
