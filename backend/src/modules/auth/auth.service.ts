import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../database/prisma.service';

import * as bcrypt from 'bcrypt';

import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    organizationId: string;
    role?: Role;
  }) {
    const hashedPassword =
      await bcrypt.hash(
        data.password,
        10,
      );

    const user =
      await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          organizationId:
            data.organizationId,
          role:
            data.role ??
            Role.LAWYER,
        },
      });

    return this.getJwtToken(user);
  }

  async login(
    email: string,
    password: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: { email },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!validPassword) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    return this.getJwtToken(user);
  }

  private getJwtToken(user: {
    id: string;
    email: string;
    organizationId: string;
    role: Role;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId:
        user.organizationId,
      role: user.role,
    };

    return {
      access_token:
        this.jwtService.sign(payload),
    };
  }
}
