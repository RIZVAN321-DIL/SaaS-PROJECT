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

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // =========================
  // CREATE TASK
  // =========================
  @Post()
  create(@Body() body: any, @Req() req: Request) {
    const user = req.user as any;

    return this.tasksService.create({
      ...body,
      organizationId: user.organizationId,
    });
  }

  // =========================
  // GET ALL TASKS
  // =========================
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;

    return this.tasksService.findAll(user.organizationId);
  }

  // =========================
  // GET ONE TASK
  // =========================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  // =========================
  // UPDATE TASK
  // =========================
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.tasksService.update(id, body);
  }

  // =========================
  // DELETE TASK
  // =========================
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  // =========================
  // ASSIGN TASK
  // =========================
  @Put(':id/assign/:userId')
  assign(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tasksService.assignTask(id, userId);
  }

  // =========================
  // COMPLETE TASK
  // =========================
  @Put(':id/complete')
  complete(@Param('id') id: string) {
    return this.tasksService.completeTask(id);
  }
}
