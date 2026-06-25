import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =========================
  // REGISTER (пользователь в существующей организации)
  // =========================
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: RegisterDto,
  ) {
    return this.authService.register(body);
  }

  // =========================
  // REGISTER ORGANIZATION (атомарная регистрация с нуля)
  // =========================
  @Public()
  @Post('register-organization')
  @HttpCode(HttpStatus.CREATED)
  async registerOrganization(
    @Body() body: RegisterOrganizationDto,
  ) {
    return this.authService.registerWithOrganization(body);
  }

  // =========================
  // LOGIN
  // Ограничен: 10 попыток в минуту с одного IP — защита от брутфорса.
  // =========================
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
  ) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }

  // =========================
  // 2FA: ПРОВЕРКА КОДА ИЗ ПИСЬМА
  // Жёстко ограничен по частоте — это точка перебора 6-значного кода
  // =========================
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(
    @Body() body: VerifyTwoFactorDto,
  ) {
    return this.authService.verifyTwoFactor(
      body.challengeId,
      body.code,
    );
  }

  // =========================
  // 2FA: ВКЛЮЧИТЬ / ВЫКЛЮЧИТЬ (для текущего пользователя)
  // =========================
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enableTwoFactor(
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;
    return this.authService.enableTwoFactor(user.userId);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disableTwoFactor(
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;
    return this.authService.disableTwoFactor(user.userId);
  }

  // =========================
  // ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
  // =========================
  @Get('me')
  async me(
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;
    return this.authService.getMe(user.userId);
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshTokenDto,
  ) {
    return this.authService.refresh(
      body.userId,
      body.refreshToken,
    );
  }

  // =========================
  // FORGOT PASSWORD
  // Ограничен: 5 запросов в минуту — защита от спама на почту.
  // =========================
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(body.email);
  }

  // =========================
  // RESET PASSWORD
  // =========================
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      body.token,
      body.newPassword,
    );
  }

  // =========================
  // LOGOUT
  // =========================
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;
    await this.authService.logout(user.userId);
    return { success: true };
  }
                        }
