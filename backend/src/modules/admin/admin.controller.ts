import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { GrantOverrideDto } from './dto/grant-override.dto';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { JwtUser } from '../auth/jwt.strategy';

@UseGuards(PlatformAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('organizations')
  async getOrganizations() {
    return this.adminService.getAllOrganizations();
  }

  @Post('organizations/:id/override')
  async grantOverride(
    @Param('id') id: string,
    @Body() body: GrantOverrideDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;
    return this.adminService.grantOverride(id, body, user.userId);
  }

  @Delete('organizations/:id/override')
  async revokeOverride(@Param('id') id: string) {
    return this.adminService.revokeOverride(id);
  }

  // =========================
  // DELETE ORGANIZATION
  // Удаляет организацию вместе со всеми данными.
  // Доступно только платформенному администратору.
  // =========================
  @Delete('organizations/:id')
  @HttpCode(HttpStatus.OK)
  async deleteOrganization(@Param('id') id: string) {
    return this.adminService.deleteOrganization(id);
  }
}
