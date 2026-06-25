import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  // =========================
  // CREATE (приглашение сотрудника владельцем/админом)
  // Пароль не принимается от клиента — генерируется на сервере
  // и возвращается один раз в ответе, чтобы владелец передал его сотруднику.
  // =========================
  async create(data: {
    email: string;
    organizationId: string;
    role?: Role;
  }) {
    const email = data.email.trim().toLowerCase();

    if (data.role === Role.OWNER) {
      throw new BadRequestException(
        'Нельзя создать второго владельца через приглашение',
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { email, organizationId: data.organizationId },
    });

    if (existing) {
      throw new ConflictException(
        'Пользователь с таким email уже есть в организации',
      );
    }

    const temporaryPassword = crypto.randomBytes(9).toString('base64url');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        organizationId: data.organizationId,
        role: data.role ?? Role.LAWYER,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });

    return { ...user, temporaryPassword };
  }

  // =========================
  // REMOVE (удаление сотрудника)
  // Нельзя удалить себя и нельзя удалить OWNER.
  // Доступно только OWNER и ADMIN.
  // =========================
  async remove(
    targetId: string,
    requesterId: string,
    organizationId: string,
  ) {
    if (targetId === requesterId) {
      throw new BadRequestException(
        'Нельзя удалить собственный аккаунт',
      );
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetId, organizationId },
    });

    if (!target) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (target.role === Role.OWNER) {
      throw new ForbiddenException(
        'Нельзя удалить владельца организации',
      );
    }

    // Обнуляем внешние ключи вместо каскадного удаления,
    // чтобы не потерять задачи и документы организации
    await this.prisma.$transaction([
      this.prisma.task.updateMany({
        where: { assignedToId: targetId, organizationId },
        data: { assignedToId: null },
      }),
      this.prisma.user.delete({
        where: { id: targetId },
      }),
    ]);

    return { success: true, id: targetId };
  }
}
