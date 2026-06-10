import { Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

import { Role } from '../../common/enums/role.enum';

export interface JwtUser {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  // =========================
  // RBAC USER CONTEXT
  // =========================
  async validate(
    payload: JwtPayload,
  ): Promise<JwtUser> {
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  }
}
