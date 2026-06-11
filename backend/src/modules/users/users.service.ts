import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    organizationId: string,
  ) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
      },

      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(
    id: string,
    organizationId: string,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
        },

        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  async create(data: {
    email: string;
    password: string;
    organizationId: string;
    role?: Role;
  }) {
    const existing =
      await this.prisma.user.findFirst({
        where: {
          email: data.email,
          organizationId:
            data.organizationId,
        },
      });

    if (existing) {
      throw new ConflictException(
        'User already exists',
      );
    }

    const password =
      await bcrypt.hash(
        data.password,
        10,
      );

    return this.prisma.user.create({
      data: {
        email: data.email,
        password,
        organizationId:
          data.organizationId,
        role:
          data.role ??
          Role.LAWYER,
      },

      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }
}
