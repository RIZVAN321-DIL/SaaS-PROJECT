import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CaseTypesService } from './case-types.service';

@Controller('case-types')
export class CaseTypesController {
  constructor(private caseTypesService: CaseTypesService) {}

  @Post()
  create(@Body() body: any) {
    return this.caseTypesService.create(body);
  }

  @Get(':organizationId')
  findAll(@Param('organizationId') organizationId: string) {
    return this.caseTypesService.findAll(organizationId);
  }

  @Get('one/:id')
  findOne(@Param('id') id: string) {
    return this.caseTypesService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.caseTypesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.caseTypesService.remove(id);
  }
}
