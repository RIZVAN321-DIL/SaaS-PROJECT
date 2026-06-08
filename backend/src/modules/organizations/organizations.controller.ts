import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Post()
  async create(@Body() body: { name: string }) {
    return this.orgService.createOrganization(body.name);
  }

  @Post(':id/add-user')
  async addUser(
    @Param('id') organizationId: string,
    @Body() body: { userId: number },
  ) {
    return this.orgService.addUserToOrganization(body.userId, Number(organizationId));
  }

  @Get(':id/users')
  async getUsers(@Param('id') organizationId: string) {
    return this.orgService.getUsersInOrganization(Number(organizationId));
  }

  @Get()
  async getAll() {
    return this.orgService.getAllOrganizations();
  }
}
