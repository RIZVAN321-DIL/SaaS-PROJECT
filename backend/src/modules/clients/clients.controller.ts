import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';

import { Request } from 'express';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // =========================
  // CREATE CLIENT
  // =========================
  @Post()
  create(@Body() body: any, @Req() req: Request) {
    const user = req.user as any;

    return this.clientsService.create({
      ...body,
      organizationId: user.organizationId,
    });
  }

  // =========================
  // GET ALL CLIENTS
  // =========================
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;

    return this.clientsService.findAll(user.organizationId);
  }

  // =========================
  // GET ONE CLIENT
  // =========================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }

  // =========================
  // UPDATE CLIENT
  // =========================
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.clientsService.update(id, body);
  }

  // =========================
  // DELETE CLIENT
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
