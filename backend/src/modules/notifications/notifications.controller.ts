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
  // RBAC: кто какие уведомления видит
  //
  // LAWYER / ASSISTANT — только свои задачи.
  // OWNER / ADMIN      — могут смотреть любого пользователя через ?userId=
  //                      без ?userId= видят свои.
  // =========================
  private resolveTargetUser(
    currentUser: JwtUser,
    requestedUserId?: string,
  ): string {
    const isAdmin =
      currentUser.role === Role.OWNER ||
      currentUser.role === Role.ADMIN;

    if (isAdmin) {
      // Если явно запросили конкретного пользователя — показываем его,
      // иначе показываем задачи самого администратора
      return requestedUserId ?? currentUser.userId;
    }

    // Обычный пользователь не может смотреть чужие уведомления
    if (requestedUserId && requestedUserId !== currentUser.userId) {
      throw new ForbiddenException(
        'У вас нет доступа к уведомлениям других пользователей',
      );
    }

    return currentUser.userId;
  }

  // =========================
  // GET ALL NOTIFICATIONS
  // =========================
  @Get()
  async getNotifications(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ) {
    const user = req.user as JwtUser;
    const targetUserId = this.resolveTargetUser(user, userId);

    return this.notificationsService.getNotifications(
      user.organizationId,
      targetUserId,
    );
  }

  // =========================
  // OVERDUE TASKS
  // =========================
  @Get('overdue')
  async getOverdue(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ) {
    const user = req.user as JwtUser;
    const targetUserId = this.resolveTargetUser(user, userId);

    return this.notificationsService.getOverdueTasks(
      user.organizationId,
      targetUserId,
    );
  }

  // =========================
  // UPCOMING TASKS
  // =========================
  @Get('upcoming')
  async getUpcoming(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ) {
    const user = req.user as JwtUser;
    const targetUserId = this.resolveTargetUser(user, userId);

    return this.notificationsService.getUpcomingTasks(
      user.organizationId,
      targetUserId,
    );
  }
}
