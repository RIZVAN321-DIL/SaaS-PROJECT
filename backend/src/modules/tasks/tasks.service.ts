import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TaskStatus } from './dto/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CREATE TASK
  // =========================
  async create(data: {
    organizationId: string;
    caseId: string;
    title: string;
    description?: string;
    dueDate?: Date;
    assignedToId?: string;
  }) {
    const caseItem =
      await this.prisma.case.findFirst({
        where: {
          id: data.caseId,
          organizationId:
            data.organizationId,
        },
      });

    if (!caseItem) {
      throw new NotFoundException(
        'Case not found',
      );
    }

    if (data.assignedToId) {
      const user =
        await this.prisma.user.findFirst({
          where: {
            id: data.assignedToId,
            organizationId:
              data.organizationId,
          },
        });

      if (!user) {
        throw new NotFoundException(
          'Assigned user not found',
        );
      }
    }

    return this.prisma.task.create({
      data: {
        ...data,
        status: TaskStatus.PENDING,
      },
    });
  }

  // =========================
  // GET ALL TASKS
  // =========================
  async findAll(
    organizationId: string,
  ) {
    return this.prisma.task.findMany({
      where: {
        organizationId,
      },
      include: {
        case: true,
        assignedTo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================
  // GET ONE TASK
  // TENANT SAFE
  // =========================
  async findById(
    id: string,
    organizationId: string,
  ) {
    const task =
      await this.prisma.task.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          case: true,
          assignedTo: true,
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return task;
  }

  // =========================
  // UPDATE TASK
  // =========================
  async update(
    id: string,
    organizationId: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      assignedToId?: string;
      status?: TaskStatus;
    },
  ) {
    await this.findById(
      id,
      organizationId,
    );

    if (data.assignedToId) {
      const user =
        await this.prisma.user.findFirst({
          where: {
            id: data.assignedToId,
            organizationId,
          },
        });

      if (!user) {
        throw new NotFoundException(
          'Assigned user not found',
        );
      }
    }

    const updateData: any = {
      ...data,
    };

    // =========================
    // AUTO COMPLETION LOGIC
    // =========================
    if (
      data.status ===
      TaskStatus.COMPLETED
    ) {
      updateData.completedAt =
        new Date();
    }

    return this.prisma.task.update({
      where: {
        id,
      },
      data: updateData,
    });
  }

  // =========================
  // DELETE TASK
  // =========================
  async remove(
    id: string,
    organizationId: string,
  ) {
    await this.findById(
      id,
      organizationId,
    );

    return this.prisma.task.delete({
      where: {
        id,
      },
    });
  }

  // =========================
  // ASSIGN TASK
  // =========================
  async assignTask(
    taskId: string,
    userId: string,
    organizationId: string,
  ) {
    await this.findById(
      taskId,
      organizationId,
    );

    const user =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        assignedToId: userId,
      },
    });
  }

  // =========================
  // COMPLETE TASK
  // =========================
  async completeTask(
    taskId: string,
    organizationId: string,
  ) {
    await this.findById(
      taskId,
      organizationId,
    );

    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status:
          TaskStatus.COMPLETED,
        completedAt:
          new Date(),
      },
    });
  }
}
