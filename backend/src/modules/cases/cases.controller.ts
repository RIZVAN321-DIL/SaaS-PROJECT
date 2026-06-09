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

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  // =========================
  // CREATE CASE
  // =========================
  @Post()
  create(@Body() body: any, @Req() req: Request) {
    const user = req.user as any;

    return this.casesService.create({
      ...body,
      userId: user.userId,
      organizationId: user.organizationId,
    });
  }

  // =========================
  // GET ALL CASES
  // =========================
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;

    return this.casesService.findAll(user.organizationId);
  }

  // =========================
  // GET ONE CASE
  // =========================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  // =========================
  // UPDATE CASE
  // =========================
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const user = req.user as any;

    return this.casesService.update(id, {
      ...body,
      organizationId: user.organizationId,
      userId: user.userId,
    });
  }

  // =========================
  // DELETE CASE
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;

    return this.casesService.remove(
      id,
      user.organizationId,
      user.userId,
    );
  }

  // =========================
  // KANBAN BOARD
  // =========================
  @Get('board')
  getBoard(@Req() req: Request) {
    const user = req.user as any;

    return this.casesService.getBoard(user.organizationId);
  }

  // =========================
  // MOVE CASE
  // =========================
  @Put('move/:caseId/:stageId')
  moveCase(
    @Param('caseId') caseId: string,
    @Param('stageId') stageId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.casesService.moveCase(
      caseId,
      stageId,
      user.organizationId,
      user.userId,
    );
  }
                }
