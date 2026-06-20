import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async getAll(
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.usersService.findAll(
      user.organizationId,
    );
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.usersService.findById(
      id,
      user.organizationId,
    );
  }

  // =========================
  // CREATE (приглашение сотрудника) — только владелец/админ
  // =========================
  @Roles(
    Role.OWNER,
    Role.ADMIN,
  )
  @Post()
  async create(
    @Body() body: CreateUserDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.usersService.create({
      email: body.email,
      role: body.role,
      organizationId: user.organizationId,
    });
  }
}
