import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

import { Role } from '../enums/role.enum';

interface JwtUser {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    // =========================
    // PUBLIC ROUTE CHECK
    // =========================
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (isPublic) {
      return true;
    }

    // =========================
    // ROLES CHECK
    // =========================
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user =
      request.user as JwtUser | undefined;

    if (!user) {
      throw new UnauthorizedException(
        'User not authenticated',
      );
    }

    if (!user.role) {
      throw new ForbiddenException(
        'Role not found',
      );
    }

    const hasRole =
      requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Insufficient permissions',
      );
    }

    return true;
  }
}
