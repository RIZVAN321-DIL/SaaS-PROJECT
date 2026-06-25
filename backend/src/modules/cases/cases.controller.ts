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

import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
  ) {}

  @Post()
  create(
    @Body() body: CreateCaseDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.casesService.create({
      ...body,
      userId: user.userId,
      organizationId: user.organizationId,
    });
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.casesService.findAll(user.organizationId);
  }

  // ВАЖНО: /board и /move/:caseId/:stageId — выше :id
  @Get('board')
  getBoard(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.casesService.getBoard(user.organizationId);
  }

  @Put('move/:caseId/:stageId')
  moveCase(
    @Param('caseId') caseId: string,
    @Param('stageId') stageId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.casesService.moveCase(
      caseId,
      stageId,
      user.organizationId,
      user.userId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.casesService.findById(id, user.organizationId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateCaseDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.casesService.update(id, {
      ...body,
      organizationId: user.organizationId,
      userId: user.userId,
    });
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.casesService.remove(id, user.organizationId, user.userId);
  }
}
