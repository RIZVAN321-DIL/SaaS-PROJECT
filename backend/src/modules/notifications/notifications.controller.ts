import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get(':organizationId')
  getNotifications(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.notificationsService.getNotifications(
      organizationId,
    );
  }

  @Get('overdue/:organizationId')
  getOverdue(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.notificationsService.getOverdueTasks(
      organizationId,
    );
  }

  @Get('upcoming/:organizationId')
  getUpcoming(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.notificationsService.getUpcomingTasks(
      organizationId,
    );
  }
}
