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
import { CalendarService } from './calendar.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
  ) {}

  // =========================
  // CREATE EVENT
  // =========================
  @Post()
  create(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.calendarService.create({
      ...body,
      organizationId:
        user.organizationId,
    });
  }

  // =========================
  // GET ALL EVENTS
  // =========================
  @Get()
  findAll(
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.calendarService.findAll(
      user.organizationId,
    );
  }

  // =========================
  // GET ONE EVENT
  // TENANT SAFE
  // =========================
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.calendarService.findById(
      id,
      user.organizationId,
    );
  }

  // =========================
  // UPDATE EVENT
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

    return this.calendarService.update(
      id,
      user.organizationId,
      body,
    );
  }

  // =========================
  // DELETE EVENT
  // TENANT SAFE
  // =========================
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.calendarService.remove(
      id,
      user.organizationId,
    );
  }
}
