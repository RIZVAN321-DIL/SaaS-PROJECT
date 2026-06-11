import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CREATE EVENT
  // =========================
  async create(data: {
    organizationId: string;
    caseId?: string;
    title: string;
    description?: string;
    date: Date;
    participants?: string[];
  }) {
    if (data.caseId) {
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
    }

    if (
      data.participants &&
      data.participants.length > 0
    ) {
      const users =
        await this.prisma.user.findMany({
          where: {
            id: {
              in: data.participants,
            },
            organizationId:
              data.organizationId,
          },
        });

      if (
        users.length !==
        data.participants.length
      ) {
        throw new NotFoundException(
          'One or more participants not found',
        );
      }
    }

    return this.prisma.calendarEvent.create({
      data,
    });
  }

  // =========================
  // GET ALL EVENTS
  // =========================
  async findAll(
    organizationId: string,
  ) {
    return this.prisma.calendarEvent.findMany({
      where: {
        organizationId,
      },
      include: {
        case: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  // =========================
  // GET ONE EVENT
  // TENANT SAFE
  // =========================
  async findById(
    id: string,
    organizationId: string,
  ) {
    const event =
      await this.prisma.calendarEvent.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          case: true,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Event not found',
      );
    }

    return event;
  }

  // =========================
  // UPDATE EVENT
  // =========================
  async update(
    id: string,
    organizationId: string,
    data: {
      title?: string;
      description?: string;
      date?: Date;
      participants?: string[];
    },
  ) {
    await this.findById(
      id,
      organizationId,
    );

    if (data.participants) {
      const users =
        await this.prisma.user.findMany({
          where: {
            id: {
              in: data.participants,
            },
            organizationId,
          },
        });

      if (
        users.length !==
        data.participants.length
      ) {
        throw new NotFoundException(
          'One or more participants not found',
        );
      }
    }

    return this.prisma.calendarEvent.update({
      where: {
        id,
      },
      data,
    });
  }

  // =========================
  // DELETE EVENT
  // =========================
  async remove(
    id: string,
    organizationId: string,
  ) {
    await this.findById(
      id,
      organizationId,
    );

    return this.prisma.calendarEvent.delete({
      where: {
        id,
      },
    });
  }
}
