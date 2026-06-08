import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  create(@Body() body: any) {
    return this.documentsService.create(body);
  }

  @Get(':organizationId')
  findAll(@Param('organizationId') organizationId: string) {
    return this.documentsService.findAll(organizationId);
  }

  @Get('one/:id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
