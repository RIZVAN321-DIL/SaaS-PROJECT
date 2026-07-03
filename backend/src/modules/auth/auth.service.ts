import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums/role.enum';
import { Resend } from 'resend';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { twoFactorCodeEmail, passwordResetEmail, inviteEmail, deadlineReminderEmail } from './email-templates';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней
const OTP_TTL_MS = 10 * 60 * 1000;         // 10 минут

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  // =========================
  // REGISTER (в существующую организацию)
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
      throw new NotFoundException('Организация не найдена');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { organizationId: data.organizationId, email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
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
  // REGISTER ORGANIZATION (новая организация + владелец)
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
        'Организация с таким названием уже зарегистрирована',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: organizationName },
      });

      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          organizationId: organization.id,
          role: Role.OWNER,
        },
      });

      // Создаём стандартные стадии воронки
      await tx.caseStage.createMany({
        data: [
          { name: 'Новое обращение', order: 1, color: '#3B82F6', organizationId: organization.id },
          { name: 'В работе',        order: 2, color: '#F59E0B', organizationId: organization.id },
          { name: 'Ожидание клиента',order: 3, color: '#A855F7', organizationId: organization.id },
          { name: 'Завершено',       order: 4, color: '#22C55E', organizationId: organization.id },
        ],
      });

      return { organization, user: createdUser };
    });

    return this.generateTokens(user);
  }

  // =========================
  // LOGIN
  // =========================
  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    // Намеренно одинаковое сообщение для email и пароля — не даём перебирать email
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // =========================
    // ПРОВЕРКА ПОДПИСКИ
    // Платформенные администраторы обходят проверку подписки.
    // =========================
    if (!user.isPlatformAdmin) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { organizationId: user.organizationId },
      });

      const isActiveSubscription =
        subscription?.status === 'active' ||
        subscription?.status === 'trialing';

      // manualOverride: проверяем срок действия, если задан
      const overrideValid =
        subscription?.manualOverride &&
        (subscription.overrideExpiresAt === null ||
          subscription.overrideExpiresAt > new Date());

      if (!isActiveSubscription && !overrideValid) {
        throw new ForbiddenException(
          'Требуется активная подписка. Обратитесь к администратору или оформите подписку.',
        );
      }
    }

    if (user.twoFactorEnabled) {
      return this.startTwoFactorChallenge(user.id, user.email);
    }

    return this.generateTokens(user);
  }

  // =========================
  // 2FA: ОТПРАВКА OTP-КОДА
  // =========================
  private async startTwoFactorChallenge(userId: string, email: string) {
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const otp = await this.prisma.loginOtp.create({
      data: { userId, codeHash, expiresAt },
    });

    const { subject, html, text } = twoFactorCodeEmail(code);
    await this.sendEmail({ to: email, subject, html, text });

    return { requiresTwoFactor: true, challengeId: otp.id };
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
      throw new UnauthorizedException('Неверный код подтверждения');
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
  // 2FA: ВКЛ / ВЫКЛ
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
  // GET ME
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
        isPlatformAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  // =========================
  // INVITE: отправить сотруднику ссылку для установки пароля
  // Вызывается из UsersService после создания аккаунта сотрудника.
  // Возвращает true, если письмо реально ушло (Resend настроен и не вернул ошибку).
  // =========================
  async sendInvite(userId: string, email: string, roleLabel: string): Promise<boolean> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const setPasswordLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    const { subject, html, text } = inviteEmail(setPasswordLink, roleLabel);
    return this.sendEmail({ to: email, subject, html, text });
  }

  // =========================
  // DEADLINE REMINDER: вызывается из DeadlinesService (cron)
  // =========================
  async sendDeadlineReminder(
    to: string,
    caseTitle: string,
    caseId: string,
    deadlineLabel: string | null,
    deadlineDate: Date,
  ): Promise<boolean> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const caseLink = `${frontendUrl}/cases/${caseId}`;

    const { subject, html, text } = deadlineReminderEmail(
      caseTitle,
      deadlineLabel,
      deadlineDate,
      caseLink,
    );
    return this.sendEmail({ to, subject, html, text });
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // Всегда возвращаем одинаковый ответ — не раскрываем наличие email в базе
    const genericResponse = {
      message:
        'Если такой email зарегистрирован, на него отправлена ссылка для сброса пароля.',
    };

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) return genericResponse;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    const { subject, html, text } = passwordResetEmail(resetLink);
    await this.sendEmail({ to: normalizedEmail, subject, html, text });

    return genericResponse;
  }

  // =========================
  // RESET PASSWORD
  // =========================
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Ссылка для сброса пароля недействительна или устарела',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword, refreshToken: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Пароль успешно изменён' };
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Доступ запрещён — войдите снова');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!valid) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    return this.generateTokens(user);
  }

  // =========================
  // LOGOUT
  // =========================
  async logout(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // =========================
  // PRIVATE: SEND EMAIL
  // =========================
  private async sendEmail(data: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(
        `[EMAIL STUB] RESEND_API_KEY не задан — письмо НЕ отправлено. To: ${data.to} | Subject: ${data.subject}`,
      );
      return false;
    }

    const fromAddress =
      this.config.get<string>('RESEND_FROM_ADDRESS') || 'CaseFlow <onboarding@resend.dev>';

    try {
      const result = await this.resend.emails.send({
        from: fromAddress,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      });
      if (result.error) {
        // Resend возвращает ошибку в теле ответа, а не всегда бросает исключение
        // (например: домен отправителя не верифицирован, получатель вне sandbox-списка).
        this.logger.error(
          `Resend отклонил письмо для ${data.to}: ${result.error.message}`,
        );
        return false;
      }
      this.logger.log(`Email отправлен: ${data.to} (id: ${result.data?.id})`);
      return true;
    } catch (err) {
      this.logger.error(`Ошибка отправки email на ${data.to}`, err as Error);
      return false;
    }
  }

  // =========================
  // PRIVATE: GENERATE TOKENS
  // =========================
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

    return { access_token: accessToken, refresh_token: refreshToken };
  }
        }
