import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TaskStatus } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // =========================
  // CREATE TASK
  // =========================
  async create(data: {
    organizationId: string;
    caseId: string;
    title: string;
    description?: string;
    dueDate?: string | Date;
    assignedToId?: string;
    userId: string;
  }) {
    const caseItem = await this.prisma.case.findFirst({
      where: {
        id: data.caseId,
        organizationId: data.organizationId,
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Дело не найдено');
    }

    if (data.assignedToId) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: data.assignedToId,
          organizationId: data.organizationId,
        },
      });

      if (!user) {
        throw new NotFoundException('Исполнитель не найден в организации');
      }
    }

    const { userId, ...taskData } = data;

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        status: TaskStatus.PENDING,
      },
    });

    await this.audit.log({
      organizationId: data.organizationId,
      userId,
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: task.id,
      meta: { title: task.title, caseId: data.caseId },
    });

    return task;
  }

  // =========================
  // GET ALL
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.task.findMany({
      where: { organizationId },
      include: {
        case: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // GET ONE
  // =========================
  async findById(id: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
      include: {
        case: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    return task;
  }

  // =========================
  // UPDATE
  // =========================
  async update(
    id: string,
    organizationId: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: string | Date;
      assignedToId?: string;
      status?: TaskStatus;
    },
  ) {
    await this.findById(id, organizationId);

    if (data.assignedToId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.assignedToId, organizationId },
      });
      if (!user) {
        throw new NotFoundException('Исполнитель не найден в организации');
      }
    }

    const updateData: Record<string, unknown> = { ...data };

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    if (data.status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.prisma.task.delete({ where: { id } });
  }

  // =========================
  // ASSIGN
  // =========================
  async assignTask(taskId: string, userId: string, organizationId: string) {
    await this.findById(taskId, organizationId);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден в организации');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assignedToId: userId },
    });
  }

  // =========================
  // COMPLETE
  // =========================
  async completeTask(taskId: string, organizationId: string, userId: string) {
    const task = await this.findById(taskId, organizationId);

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: 'TASK_COMPLETED',
      entity: 'Task',
      entityId: taskId,
      meta: { title: task.title, caseId: task.caseId },
    });

    return updated;
  }
}
