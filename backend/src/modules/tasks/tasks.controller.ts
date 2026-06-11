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
import { TasksService } from './tasks.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  // =========================
  // CREATE TASK
  // =========================
  @Post()
  create(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.tasksService.create({
      ...body,
      organizationId:
        user.organizationId,
    });
  }

  // =========================
  // GET ALL TASKS
  // =========================
  @Get()
  findAll(
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.tasksService.findAll(
      user.organizationId,
    );
  }

  // =========================
  // GET ONE TASK
  // TENANT SAFE
  // =========================
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.tasksService.findById(
      id,
      user.organizationId,
    );
  }

  // =========================
  // UPDATE TASK
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

    return this.tasksService.update(
      id,
      user.organizationId,
      body,
    );
  }

  // =========================
  // DELETE TASK
  // TENANT SAFE
  // =========================
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.tasksService.remove(
      id,
      user.organizationId,
    );
  }

  // =========================
  // ASSIGN TASK
  // TENANT SAFE
  // =========================
  @Put(':id/assign/:userId')
  assign(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.tasksService.assignTask(
      id,
      userId,
      user.organizationId,
    );
  }

  // =========================
  // COMPLETE TASK
  // TENANT SAFE
  // =========================
  @Put(':id/complete')
  complete(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.tasksService.completeTask(
      id,
      user.organizationId,
    );
  }
}
