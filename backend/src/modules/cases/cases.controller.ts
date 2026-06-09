import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';

import { CasesService } from './cases.service';

@Controller('cases')
export class CasesController {
  constructor(private casesService: CasesService) {}

  // =========================
  // CREATE CASE
  // =========================
  @Post()
  create(@Body() body: any) {
    return this.casesService.create(body);
  }

  // =========================
  // GET ALL CASES
  // =========================
  @Get(':organizationId')
  findAll(@Param('organizationId') organizationId: string) {
    return this.casesService.findAll(organizationId);
  }

  // =========================
  // GET ONE CASE
  // =========================
  @Get('one/:id')
  findOne(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  // =========================
  // UPDATE CASE
  // =========================
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.casesService.update(id, body);
  }

  // =========================
  // DELETE CASE
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }

  // =========================
  // 🧠 KANBAN BOARD
  // =========================
  @Get('board/:organizationId')
  getBoard(@Param('organizationId') organizationId: string) {
    return this.casesService.getBoard(organizationId);
  }

  // =========================
  // 🔄 MOVE CASE (DRAG & DROP)
  // =========================
  @Put('move/:caseId/:stageId')
  moveCase(
    @Param('caseId') caseId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.casesService.moveCase(caseId, stageId);
  }
}
