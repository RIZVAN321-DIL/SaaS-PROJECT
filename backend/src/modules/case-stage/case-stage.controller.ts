import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { CaseStageService } from './case-stage.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('case-stages')
export class CaseStageController {
  constructor(
    private readonly caseStageService: CaseStageService,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.caseStageService.findAll(user.organizationId);
  }

  @Get('board')
  getBoard(@Req() req: Request) {
    const user = req.user as any;
    return this.caseStageService.getBoard(user.organizationId);
  }

  @Get('single/:id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.caseStageService.findOne(id, user.organizationId);
  }

  // =========================
  // CREATE — при конфликте order сдвигает последующие стадии на +1
  // Доступно OWNER и ADMIN
  // =========================
  @Roles(Role.OWNER, Role.ADMIN)
  @Post()
  create(
    @Body() body: { name: string; order: number; color?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.caseStageService.create({
      ...body,
      organizationId: user.organizationId,
    });
  }

  // =========================
  // UPDATE — только название и цвет
  // Доступно OWNER и ADMIN
  // =========================
  @Roles(Role.OWNER, Role.ADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.caseStageService.update(id, user.organizationId, body);
  }

  // =========================
  // REMOVE — снимает привязку дел, удаляет стадию, уплотняет order
  // Доступно OWNER и ADMIN
  // =========================
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.caseStageService.remove(id, user.organizationId);
  }

  // =========================
  // MOVE CASE (drag-and-drop на канбане)
  // =========================
  @Put('move-case/:caseId/:stageId')
  moveCase(
    @Param('caseId') caseId: string,
    @Param('stageId') stageId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.caseStageService.moveCase(
      caseId,
      stageId,
      user.organizationId,
    );
  }
}
