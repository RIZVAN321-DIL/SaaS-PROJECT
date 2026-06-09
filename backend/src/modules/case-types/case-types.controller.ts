import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CaseTypesService } from './case-types.service';

@Controller('case-types')
export class CaseTypesController {
  constructor(private readonly caseTypesService: CaseTypesService) {}

  // =========================
  // CRUD
  // =========================
  @Get(':organizationId')
  findAll(@Param('organizationId') organizationId: string) {
    return this.caseTypesService.findAll(organizationId);
  }

  @Get('single/:id')
  findOne(@Param('id') id: string) {
    return this.caseTypesService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.caseTypesService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.caseTypesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.caseTypesService.remove(id);
  }

  // =========================
  // CREATE CASE FROM TYPE
  // =========================
  @Post('create-case')
  createCaseFromType(@Body() body: any) {
    return this.caseTypesService.createCaseFromType(body);
  }
}
