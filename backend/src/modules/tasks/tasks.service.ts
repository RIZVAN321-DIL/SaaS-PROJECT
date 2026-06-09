import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaskStatus } from './dto/task-status.enum';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

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
  async findAll(organizationId: string) {
    return this.prisma.task.findMany({
      where: { organizationId },
      include: {
        case: true,
        assignedTo: true,
      },
    });
  }

  // =========================
  // GET ONE TASK
  // =========================
  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        case: true,
        assignedTo: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // =========================
  // UPDATE TASK
  // =========================
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      assignedToId?: string;
      status?: TaskStatus;
    },
  ) {
    const updateData: any = { ...data };

    // =========================
    // AUTO COMPLETION LOGIC
    // =========================
    if (data.status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  // =========================
  // DELETE TASK
  // =========================
  async remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  // =========================
  // ASSIGN TASK
  // =========================
  async assignTask(taskId: string, userId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: userId,
      },
    });
  }

  // =========================
  // COMPLETE TASK
  // =========================
  async completeTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }
}
