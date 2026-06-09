import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getOverdueTasks(
    organizationId: string,
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
      },
      include: {
        case: true,
      },
    });
  }

  async getUpcomingTasks(
    organizationId: string,
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
      },
      include: {
        case: true,
      },
    });
  }

  async getNotifications(
    organizationId: string,
  ) {
    const overdue =
      await this.getOverdueTasks(
        organizationId,
      );

    const upcoming =
      await this.getUpcomingTasks(
        organizationId,
      );

    return {
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      overdue,
      upcoming,
    };
  }
}
