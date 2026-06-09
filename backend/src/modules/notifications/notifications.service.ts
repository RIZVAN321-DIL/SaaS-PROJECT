import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // OVERDUE TASKS
  // =========================
  async getOverdueTasks(
    organizationId: string,
    userId?: string,
  ) {
    return this.prisma.task.findMany({
      where: {
        organizationId,
        status: {
          not: 'completed',
        },
        dueDate: {
          lt: new Date(),
        },
        ...(userId
          ? {
              assignedToId: userId, // 🔥 Task System v2 filter
            }
          : {}),
      },
      include: {
        case: true,
        assignedTo: true, // 🔥 Task System v2
      },
    });
  }

  // =========================
  // UPCOMING TASKS (next 24h)
  // =========================
  async getUpcomingTasks(
    organizationId: string,
    userId?: string,
  ) {
    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.task.findMany({
      where: {
        organizationId,
        status: {
          not: 'completed',
        },
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
        ...(userId
          ? {
              assignedToId: userId, // 🔥 Task System v2 filter
            }
          : {}),
      },
      include: {
        case: true,
        assignedTo: true, // 🔥 Task System v2
      },
    });
  }

  // =========================
  // MAIN NOTIFICATIONS
  // =========================
  async getNotifications(
    organizationId: string,
    userId?: string,
  ) {
    const overdue = await this.getOverdueTasks(
      organizationId,
      userId,
    );

    const upcoming = await this.getUpcomingTasks(
      organizationId,
      userId,
    );

    return {
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      overdue,
      upcoming,
    };
  }
}
