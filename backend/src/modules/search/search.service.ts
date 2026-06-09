import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // GLOBAL SEARCH (JWT TENANT SAFE)
  // =========================
  async search(organizationId: string, query: string) {
    const normalizedQuery = query?.trim();

    if (!normalizedQuery) {
      return {
        clients: [],
        cases: [],
      };
    }

    // =========================
    // CLIENT SEARCH
    // =========================
    const clients = await this.prisma.client.findMany({
      where: {
        organizationId,
        OR: [
          {
            fullName: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    // =========================
    // CASE SEARCH
    // =========================
    const cases = await this.prisma.case.findMany({
      where: {
        organizationId,
        OR: [
          {
            title: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        client: true,
        caseType: true,
        stage: true,
      },
    });

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
