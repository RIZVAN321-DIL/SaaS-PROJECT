import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(organizationId: string) {
    return this.prisma.task.findMany({
      where: { organizationId },
      include: { case: true },
    });
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

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
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
