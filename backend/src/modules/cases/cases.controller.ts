import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CasesService } from './cases.service';

@Controller('cases')
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  create(@Body() body: any) {
    return this.casesService.create(body);
  }

  @Get(':organizationId')
  findAll(@Param('organizationId') organizationId: string) {
    return this.casesService.findAll(organizationId);
  }

  @Get('one/:id')
  findOne(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.casesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }
}
