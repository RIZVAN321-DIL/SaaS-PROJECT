import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
              assignedToId: userId,
            }
          : {}),
      },

      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },

        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
      },

      orderBy: {
        dueDate: 'asc',
      },

      take: 50,
    });
  }

  // =========================
  // UPCOMING TASKS (NEXT 24H)
  // =========================
  async getUpcomingTasks(
    organizationId: string,
    userId?: string,
  ) {
    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(
      tomorrow.getDate() + 1,
    );

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
              assignedToId: userId,
            }
          : {}),
      },

      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },

        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
      },

      orderBy: {
        dueDate: 'asc',
      },

      take: 50,
    });
  }

  // =========================
  // MAIN NOTIFICATIONS
  // =========================
  async getNotifications(
    organizationId: string,
    userId?: string,
  ) {
    const [overdue, upcoming] =
      await Promise.all([
        this.getOverdueTasks(
          organizationId,
          userId,
        ),

        this.getUpcomingTasks(
          organizationId,
          userId,
        ),
      ]);

    return {
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,

      overdue,
      upcoming,
    };
  }
}
