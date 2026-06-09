import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // =========================
  // FULL DASHBOARD
  // =========================
  @Get(':organizationId')
  getDashboard(@Param('organizationId') organizationId: string) {
    return this.dashboardService.getDashboard(organizationId);
  }

  // =========================
  // CASE STATS ONLY
  // =========================
  @Get('cases/:organizationId')
  getCases(@Param('organizationId') organizationId: string) {
    return this.dashboardService.getCasesStats(organizationId);
  }

  // =========================
  // CLIENT STATS ONLY
  // =========================
  @Get('clients/:organizationId')
  getClients(@Param('organizationId') organizationId: string) {
    return this.dashboardService.getClientsStats(organizationId);
  }

  // =========================
  // TASK STATS ONLY
  // =========================
  @Get('tasks/:organizationId')
  getTasks(@Param('organizationId') organizationId: string) {
    return this.dashboardService.getTasksStats(organizationId);
  }
}
