import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';

import { Request } from 'express';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';

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

  @Post()
  create(
    @Body() body: CreateClientDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.clientsService.create({
      ...body,
      organizationId: user.organizationId,
    });
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.clientsService.findAll(
      user.organizationId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.clientsService.findById(id, user.organizationId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateClientDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.clientsService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.clientsService.remove(id, user.organizationId);
  }
}
