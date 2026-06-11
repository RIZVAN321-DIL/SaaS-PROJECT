import {
  Controller,
  Get,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';

import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { Role } from '../../common/enums/role.enum';

interface JwtUser {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  // =========================
  // RBAC USER FILTER
  // =========================
  private resolveTargetUser(
    currentUser: JwtUser,
    requestedUserId?: string,
  ): string | undefined {
    const isAdmin =
      currentUser.role === Role.OWNER ||
      currentUser.role === Role.ADMIN;

    // OWNER / ADMIN
    if (isAdmin) {
      return requestedUserId ?? currentUser.userId;
    }

    // LAWYER / ASSISTANT
    if (
      requestedUserId &&
      requestedUserId !== currentUser.userId
    ) {
      throw new ForbiddenException(
        'You can only access your own notifications',
      );
    }

    return currentUser.userId;
  }

  // =========================
  // GET NOTIFICATIONS
  // =========================
  @Get()
  async getNotifications(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ) {
    const user =
      req.user as JwtUser;

    const targetUserId =
      this.resolveTargetUser(
        user,
        userId,
      );

    return this.notificationsService.getNotifications(
      user.organizationId,
      targetUserId,
    );
  }

  // =========================
  // OVERDUE ONLY
  // =========================
  @Get('overdue')
  async getOverdue(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ) {
    const user =
      req.user as JwtUser;

    const targetUserId =
      this.resolveTargetUser(
        user,
        userId,
      );

    return this.notificationsService.getOverdueTasks(
      user.organizationId,
      targetUserId,
    );
  }

  // =========================
  // UPCOMING ONLY
  // =========================
  @Get('upcoming')
  async getUpcoming(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ) {
    const user =
      req.user as JwtUser;

    const targetUserId =
      this.resolveTargetUser(
        user,
        userId,
      );

    return this.notificationsService.getUpcomingTasks(
      user.organizationId,
      targetUserId,
    );
  }
}
