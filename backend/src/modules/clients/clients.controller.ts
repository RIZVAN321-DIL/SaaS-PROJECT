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

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
  ) {}

  // =========================
  // CREATE CLIENT
  // =========================
  @Post()
  create(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.clientsService.create({
      ...body,
      organizationId:
        user.organizationId,
    });
  }

  // =========================
  // GET ALL CLIENTS
  // =========================
  @Get()
  findAll(
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.clientsService.findAll(
      user.organizationId,
    );
  }

  // =========================
  // GET ONE CLIENT
  // TENANT SAFE
  // =========================
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.clientsService.findById(
      id,
      user.organizationId,
    );
  }

  // =========================
  // UPDATE CLIENT
  // TENANT SAFE
  // =========================
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.clientsService.update(
      id,
      user.organizationId,
      body,
    );
  }

  // =========================
  // DELETE CLIENT
  // TENANT SAFE
  // =========================
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.clientsService.remove(
      id,
      user.organizationId,
    );
  }
}
