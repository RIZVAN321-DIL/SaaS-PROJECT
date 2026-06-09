import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CASES OVERVIEW
  // =========================
  async getCasesStats(organizationId: string) {
    const totalCases = await this.prisma.case.count({
      where: { organizationId },
    });

    const byStage = await this.prisma.caseStage.findMany({
      where: { organizationId },
      include: {
        cases: true,
      },
    });

    return {
      totalCases,
      byStage: byStage.map((stage) => ({
        stageId: stage.id,
        name: stage.name,
        color: stage.color,
        count: stage.cases.length,
      })),
    };
  }

  // =========================
  // CLIENTS OVERVIEW
  // =========================
  async getClientsStats(organizationId: string) {
    const totalClients = await this.prisma.client.count({
      where: { organizationId },
    });

    return {
      totalClients,
    };
  }

  // =========================
  // TASKS OVERVIEW
  // =========================
  async getTasksStats(organizationId: string) {
    const totalTasks = await this.prisma.task.count({
      where: { organizationId },
    });

    const pendingTasks = await this.prisma.task.count({
      where: {
        organizationId,
        status: 'pending',
      },
    });

    const completedTasks = await this.prisma.task.count({
      where: {
        organizationId,
        status: 'completed',
      },
    });

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
    };
  }

  // =========================
  // FULL DASHBOARD
  // =========================
  async getDashboard(organizationId: string) {
    const [cases, clients, tasks] = await Promise.all([
      this.getCasesStats(organizationId),
      this.getClientsStats(organizationId),
      this.getTasksStats(organizationId),
    ]);

    return {
      cases,
      clients,
      tasks,
    };
  }
}
