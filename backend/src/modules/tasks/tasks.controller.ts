import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(@Body() body: any) {
    return this.tasksService.create(body);
  }

  @Get(':organizationId')
  findAll(@Param('organizationId') organizationId: string) {
    return this.tasksService.findAll(organizationId);
  }

  @Get('one/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.tasksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
