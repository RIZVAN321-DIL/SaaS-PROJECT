import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { OrganizationsService } from './organizations.service';

import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly orgService: OrganizationsService,
  ) {}

  @Public()
  @Post()
  async create(
    @Body() body: { name: string },
  ) {
    return this.orgService.createOrganization(
      body.name,
    );
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':id/add-user')
  async addUser(
    @Param('id') organizationId: string,
    @Body() body: { userId: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;

    if (user.organizationId !== organizationId) {
      throw new Error(
        'Access denied to another organization',
      );
    }

    return this.orgService.addUserToOrganization(
      body.userId,
      organizationId,
    );
  }

  @Roles(
    Role.OWNER,
    Role.ADMIN,
    Role.LAWYER,
    Role.ASSISTANT,
  )
  @Get(':id/users')
  async getUsers(
    @Param('id') organizationId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    if (user.organizationId !== organizationId) {
      throw new Error(
        'Access denied to another organization',
      );
    }

    return this.orgService.getUsersInOrganization(
      organizationId,
    );
  }

  @Roles(Role.OWNER)
  @Get()
  async getAll() {
    return this.orgService.getAllOrganizations();
  }

  @Get(':id')
  async getOrganization(
    @Param('id') organizationId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    if (user.organizationId !== organizationId) {
      throw new Error(
        'Access denied to another organization',
      );
    }

    return this.orgService.getOrganizationById(
      organizationId,
    );
  }
}
