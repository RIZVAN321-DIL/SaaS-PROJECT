import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { CasesService } from './cases.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
  ) {}

  // =========================
  // CREATE CASE
  // =========================
  @Post()
  create(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.casesService.create({
      ...body,
      userId: user.userId,
      organizationId:
        user.organizationId,
    });
  }

  // =========================
  // GET ALL CASES
  // =========================
  @Get()
  findAll(
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.casesService.findAll(
      user.organizationId,
    );
  }

  // =========================
  // KANBAN BOARD
  // IMPORTANT:
  // MUST BE ABOVE :id ROUTE
  // =========================
  @Get('board')
  getBoard(
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.casesService.getBoard(
      user.organizationId,
    );
  }

  // =========================
  // MOVE CASE
  // IMPORTANT:
  // MUST BE ABOVE :id ROUTE
  // =========================
  @Put('move/:caseId/:stageId')
  moveCase(
    @Param('caseId')
    caseId: string,

    @Param('stageId')
    stageId: string,

    @Req()
    req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.casesService.moveCase(
      caseId,
      stageId,
      user.organizationId,
      user.userId,
    );
  }

  // =========================
  // GET ONE CASE
  // TENANT SAFE
  // =========================
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.casesService.findById(
      id,
      user.organizationId,
    );
  }

  // =========================
  // UPDATE CASE
  // =========================
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.casesService.update(
      id,
      {
        ...body,
        organizationId:
          user.organizationId,
        userId:
          user.userId,
      },
    );
  }

  // =========================
  // DELETE CASE
  // OWNER / ADMIN ONLY
  // =========================
  @Roles(
    Role.OWNER,
    Role.ADMIN,
  )
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.casesService.remove(
      id,
      user.organizationId,
      user.userId,
    );
  }
}
