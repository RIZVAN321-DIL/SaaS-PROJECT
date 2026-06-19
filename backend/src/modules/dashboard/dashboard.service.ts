// Файл 11: backend/src/modules/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CASES OVERVIEW
  // =========================
  async getCasesStats(
    organizationId: string,
  ) {
    const totalCases =
      await this.prisma.case.count({
        where: {
          organizationId,
        },
      });

    const byStage =
      await this.prisma.caseStage.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          order: 'asc',
        },
        include: {
          cases: {
            where: {
              organizationId,
            },
          },
        },
      });

    const recentCases =
      await this.prisma.case.findMany({
        where: {
          organizationId,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
            },
          },
          stage: true,
          caseType: true,
        },
      });

    return {
      totalCases,
      byStage: byStage.map(
        (stage) => ({
          stageId: stage.id,
          name: stage.name,
          color: stage.color,
          count: stage.cases.length,
        }),
      ),
      recentCases,
    };
  }

  // =========================
  // CLIENTS OVERVIEW
  // =========================
  async getClientsStats(
    organizationId: string,
  ) {
    const totalClients =
      await this.prisma.client.count({
        where: {
          organizationId,
        },
      });

    const recentClients =
      await this.prisma.client.findMany({
        where: {
          organizationId,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });

    return {
      totalClients,
      recentClients,
    };
  }

  // =========================
  // TASKS OVERVIEW
  // =========================
  async getTasksStats(
    organizationId: string,
  ) {
    const totalTasks =
      await this.prisma.task.count({
        where: {
          organizationId,
        },
      });

    const pendingTasks =
      await this.prisma.task.count({
        where: {
          organizationId,
          status: 'pending',
        },
      });

    const completedTasks =
      await this.prisma.task.count({
        where: {
          organizationId,
          status: 'completed',
        },
      });

    const overdueTasks =
      await this.prisma.task.count({
        where: {
          organizationId,
          status: {
            not: 'completed',
          },
          dueDate: {
            lt: new Date(),
          },
        },
      });

    const upcomingTasks =
      await this.prisma.task.count({
        where: {
          organizationId,
          status: {
            not: 'completed',
          },
          dueDate: {
            gte: new Date(),
          },
        },
      });

    // =========================
    // LOAD BY LAWYER (для дашборда "Загрузка юристов")
    // =========================
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const tasksByUser = await this.prisma.task.findMany({
      where: {
        organizationId,
        status: {
          not: 'completed',
        },
      },
      select: {
        assignedToId: true,
        dueDate: true,
      },
    });

    const now = new Date();

    const byAssignee = users
      .map((user) => {
        const userTasks = tasksByUser.filter(
          (task) => task.assignedToId === user.id,
        );

        const overdue = userTasks.filter(
          (task) => task.dueDate && new Date(task.dueDate) < now,
        ).length;

        return {
          userId: user.id,
          email: user.email,
          role: user.role,
          activeTasks: userTasks.length,
          overdueTasks: overdue,
        };
      })
      .sort((a, b) => b.activeTasks - a.activeTasks);

    const unassignedTasks = tasksByUser.filter(
      (task) => !task.assignedToId,
    ).length;

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      upcomingTasks,
      completionRate:
        totalTasks === 0
          ? 0
          : Number(
              (
                (completedTasks /
                  totalTasks) *
                100
              ).toFixed(2),
            ),
      byAssignee,
      unassignedTasks,
    };
  }

  // =========================
  // FULL DASHBOARD
  // =========================
  async getDashboard(
    organizationId: string,
  ) {
    const [
      cases,
      clients,
      tasks,
    ] = await Promise.all([
      this.getCasesStats(
        organizationId,
      ),
      this.getClientsStats(
        organizationId,
      ),
      this.getTasksStats(
        organizationId,
      ),
    ]);

    return {
      generatedAt:
        new Date().toISOString(),
      cases,
      clients,
      tasks,
    };
  }
      }
