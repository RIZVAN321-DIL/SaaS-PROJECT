import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // GLOBAL SEARCH
  // =========================
  async search(
    organizationId: string,
    query: string,
  ) {
    const normalizedQuery =
      query?.trim();

    if (
      !normalizedQuery ||
      normalizedQuery.length < 2
    ) {
      return {
        query: normalizedQuery,
        clients: [],
        cases: [],
        total: {
          clients: 0,
          cases: 0,
        },
      };
    }

    const [clients, cases] =
      await Promise.all([
        this.prisma.client.findMany({
          where: {
            organizationId,
            OR: [
              {
                fullName: {
                  contains:
                    normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains:
                    normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                phone: {
                  contains:
                    normalizedQuery,
                  mode: 'insensitive',
                },
              },
            ],
          },

          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
          },

          take: 20,

          orderBy: {
            createdAt: 'desc',
          },
        }),

        this.prisma.case.findMany({
          where: {
            organizationId,
            OR: [
              {
                title: {
                  contains:
                    normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains:
                    normalizedQuery,
                  mode: 'insensitive',
                },
              },
            ],
          },

          include: {
            client: {
              select: {
                id: true,
                fullName: true,
              },
            },

            caseType: {
              select: {
                id: true,
                name: true,
              },
            },

            stage: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },

          take: 20,

          orderBy: {
            updatedAt: 'desc',
          },
        }),
      ]);

    return {
      query: normalizedQuery,

      clients,
      cases,

      total: {
        clients: clients.length,
        cases: cases.length,
      },
    };
  }
}
