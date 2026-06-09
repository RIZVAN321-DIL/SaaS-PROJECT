import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

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
      data,
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
        assignedTo: true, // 🔥 Task System v2
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
        assignedTo: true, // 🔥 Task System v2
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
      status?: string;
    },
  ) {
    // 🔥 auto-set completedAt
    if (data.status === 'completed') {
      (data as any).completedAt = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data,
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
  // 🔥 ASSIGN TASK (v2)
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
  // 🔥 COMPLETE TASK (v2)
  // =========================
  async completeTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }
}
