import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CaseTypesService } from './case-types.service';

@Controller('case-types')
export class CaseTypesController {
  constructor(private caseTypesService: CaseTypesService) {}

  // =========================
  // CREATE CASE TYPE
  // =========================
  @Post()
  create(
    @Body() body: {
      organizationId: string;
      name: string;
      description?: string;
    },
  ) {
    return this.caseTypesService.create(body);
  }

  // =========================
  // GET ALL CASE TYPES
  // =========================
  @Get(':organizationId')
  findAll(@Param('organizationId') organizationId: string) {
    return this.caseTypesService.findAll(organizationId);
  }

  // =========================
  // GET ONE CASE TYPE
  // =========================
  @Get('one/:id')
  findOne(@Param('id') id: string) {
    return this.caseTypesService.findById(id);
  }

  // =========================
  // UPDATE CASE TYPE
  // =========================
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
    },
  ) {
    return this.caseTypesService.update(id, body);
  }

  // =========================
  // DELETE CASE TYPE
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.caseTypesService.remove(id);
  }

  // ======================================================
  // 🧠 CASE TYPE ENGINE: CREATE CASE FROM TEMPLATE
  // ======================================================
  @Post('create-from-template')
  createFromTemplate(
    @Body() body: {
      caseTypeId: string;
      organizationId: string;
      clientId: string;
      title: string;
      description?: string;
    },
  ) {
    return this.caseTypesService.createCaseFromType(body);
  }
}
