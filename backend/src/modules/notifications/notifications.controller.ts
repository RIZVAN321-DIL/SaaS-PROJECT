import { Controller, Get, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // =========================
  // GET NOTIFICATIONS
  // =========================
  @Get()
  getNotifications(
    @Req() req: Request,
    @Query('userId') userId?: string,
  ) {
    const user = req.user as any;

    return this.notificationsService.getNotifications(
      user.organizationId,
      userId,
    );
  }

  // =========================
  // OVERDUE ONLY
  // =========================
  @Get('overdue')
  getOverdue(@Req() req: Request, @Query('userId') userId?: string) {
    const user = req.user as any;

    return this.notificationsService.getOverdueTasks(
      user.organizationId,
      userId,
    );
  }

  // =========================
  // UPCOMING ONLY
  // =========================
  @Get('upcoming')
  getUpcoming(@Req() req: Request, @Query('userId') userId?: string) {
    const user = req.user as any;

    return this.notificationsService.getUpcomingTasks(
      user.organizationId,
      userId,
    );
  }
}
