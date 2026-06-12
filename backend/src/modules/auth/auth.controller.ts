import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { Public } from '../../common/decorators/public.decorator';
import { JwtUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =========================
  // REGISTER
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
  // LOGIN
  // =========================
  @Public()
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
  // LOGOUT
  // =========================
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
  ) {
    const user =
      req.user as JwtUser;

    await this.authService.logout(
      user.userId,
    );

    return {
      success: true,
    };
  }
}
