import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час
const OTP_TTL_MS = 10 * 60 * 1000; // 10 минут

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // =========================
  // REGISTER (старый способ — для пользователя в УЖЕ существующей организации)
  // =========================
  async register(data: {
    email: string;
    password: string;
    organizationId: string;
  }) {
    const email = data.email.trim().toLowerCase();

    const organization = await this.prisma.organization.findUnique({
      where: { id: data.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        organizationId: data.organizationId,
        email,
      },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        organizationId: data.organizationId,
        role: 'LAWYER',
      },
    });

    return this.generateTokens(user);
  }

  // =========================
  // REGISTER ORGANIZATION (атомарный способ — для регистрации с нуля)
  // Создаёт организацию + владельца + дефолтные стадии канбана одной транзакцией.
  // =========================
  async registerWithOrganization(data: {
    organizationName: string;
    email: string;
    password: string;
  }) {
    const email = data.email.trim().toLowerCase();
    const organizationName = data.organizationName.trim();

    const existingOrg = await this.prisma.organization.findFirst({
      where: { name: organizationName },
    });
    if (existingOrg) {
      throw new ConflictException(
        'Organization with this name already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
        },
      });

      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          organizationId: organization.id,
          role: Role.OWNER,
        },
      });

      await tx.caseStage.createMany({
        data: [
          {
            name: 'Новое обращение',
            order: 1,
            color: '#3B82F6',
            organizationId: organization.id,
          },
          {
            name: 'В работе',
            order: 2,
            color: '#F59E0B',
            organizationId: organization.id,
          },
          {
            name: 'Ожидание клиента',
            order: 3,
            color: '#A855F7',
            organizationId: organization.id,
          },
          {
            name: 'Завершено',
            order: 4,
            color: '#22C55E',
            organizationId: organization.id,
          },
        ],
      });

      return { organization, user: createdUser };
    });

    return this.generateTokens(user);
  }

  // =========================
  // LOGIN
  // Если у пользователя включена 2FA — вместо токенов возвращаем
  // challengeId, по которому фронт запросит ввод кода из письма.
  // =========================
  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      return this.startTwoFactorChallenge(user.id, user.email);
    }

    return this.generateTokens(user);
  }

  // =========================
  // 2FA: СОЗДАНИЕ ОДНОРАЗОВОГО КОДА
  // =========================
  private async startTwoFactorChallenge(userId: string, email: string) {
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const otp = await this.prisma.loginOtp.create({
      data: {
        userId,
        codeHash,
        expiresAt,
      },
    });

    this.logger.log(
      `[2FA STUB] Код входа для ${email}: ${code} (действует 10 минут)`,
    );

    return {
      requiresTwoFactor: true,
      challengeId: otp.id,
    };
  }

  // =========================
  // 2FA: ПРОВЕРКА КОДА
  // =========================
  async verifyTwoFactor(challengeId: string, code: string) {
    const otp = await this.prisma.loginOtp.findUnique({
      where: { id: challengeId },
    });

    if (!otp || otp.usedAt || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Код недействителен или устарел');
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== otp.codeHash) {
      throw new UnauthorizedException('Неверный код');
    }

    await this.prisma.loginOtp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: otp.userId },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return this.generateTokens(user);
  }

  // =========================
  // 2FA: ВКЛЮЧИТЬ / ВЫКЛЮЧИТЬ
  // =========================
  async enableTwoFactor(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return { twoFactorEnabled: true };
  }

  async disableTwoFactor(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });
    return { twoFactorEnabled: false };
  }

  // =========================
  // ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
  // =========================
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const genericResponse = {
      message:
        'Если такой email зарегистрирован, на него отправлена ссылка для сброса пароля.',
    };

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    this.logger.log(
      `[PASSWORD RESET STUB] Ссылка для ${normalizedEmail}: ${resetLink}`,
    );

    return genericResponse;
  }

  // =========================
  // RESET PASSWORD
  // =========================
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'Ссылка для сброса пароля недействительна или устарела',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          refreshToken: null,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Пароль успешно изменён' };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
    password: string;
    refreshToken: string | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
