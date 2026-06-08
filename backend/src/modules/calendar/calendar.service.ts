import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    caseId?: string;
    title: string;
    description?: string;
    date: Date;
    participants?: string[]; // массив userId
  }) {
    return this.prisma.calendarEvent.create({
      data,
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { organizationId },
      include: { case: true },
    });
  }

  async findById(id: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      date?: Date;
      participants?: string[];
    },
  ) {
    return this.prisma.calendarEvent.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.calendarEvent.delete({
      where: { id },
    });
  }
}
