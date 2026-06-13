import {
  Controller,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { AuditService } from './audit.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  // =========================
  // GET ALL LOGS
  // =========================
  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.auditService.findAll(
      user.organizationId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  // =========================
  // GET LOGS BY USER
  // =========================
  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.auditService.findByUser(
      user.organizationId,
      userId,
    );
  }

  // =========================
  // GET LOGS BY ENTITY
  // =========================
  @Get('entity/:entity')
  findByEntity(
    @Param('entity') entity: string,
    @Query('entityId') entityId: string | undefined,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.auditService.findByEntity(
      user.organizationId,
      entity,
      entityId,
    );
  }

  // =========================
  // GET LOGS BY ACTION
  // =========================
  @Get('action/:action')
  findByAction(
    @Param('action') action: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.auditService.findByAction(
      user.organizationId,
      action,
    );
  }
}
