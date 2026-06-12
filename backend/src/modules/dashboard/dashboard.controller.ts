import {
  Controller,
  Get,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  // =========================
  // FULL DASHBOARD
  // =========================
  @Get()
  getDashboard(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.dashboardService.getDashboard(
      user.organizationId,
    );
  }

  // =========================
  // CASE STATS ONLY
  // =========================
  @Get('cases')
  getCases(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.dashboardService.getCasesStats(
      user.organizationId,
    );
  }

  // =========================
  // CLIENT STATS ONLY
  // =========================
  @Get('clients')
  getClients(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.dashboardService.getClientsStats(
      user.organizationId,
    );
  }

  // =========================
  // TASK STATS ONLY
  // =========================
  @Get('tasks')
  getTasks(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.dashboardService.getTasksStats(
      user.organizationId,
    );
  }
}
