import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Регистрация пользователя
  async register(data: { email: string; password: string; organizationId: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        organizationId: data.organizationId,
      },
    });

    return this.getJwtToken(user.id, user.email, user.organizationId);
  }

  // Логин пользователя
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return this.getJwtToken(user.id, user.email, user.organizationId);
  }

  // Генерация JWT токена
  private getJwtToken(userId: string, email: string, organizationId: string) {
    const payload = {
      sub: userId,
      email,
      organizationId,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
