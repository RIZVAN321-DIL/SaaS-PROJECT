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

  @Post()
  create(@Body() body: any, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.tasksService.create({
      ...body,
      organizationId: user.organizationId,
      userId: user.userId,
    });
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.tasksService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.tasksService.findById(id, user.organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.tasksService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.tasksService.remove(id, user.organizationId);
  }

  @Put(':id/assign/:userId')
  assign(@Param('id') id: string, @Param('userId') userId: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.tasksService.assignTask(id, userId, user.organizationId);
  }

  @Put(':id/complete')
  complete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.tasksService.completeTask(id, user.organizationId, user.userId);
  }
}
