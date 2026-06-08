import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.findById(Number(id));
  }

  @Post()
  async create(@Body() body: { email: string; password: string }) {
    return this.usersService.create(body.email, body.password);
  }
}
