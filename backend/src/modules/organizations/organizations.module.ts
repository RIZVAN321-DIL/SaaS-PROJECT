import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
  imports: [
    PrismaModule,
    PermissionsModule,
  ],
  providers: [
    OrganizationsService,
  ],
  controllers: [
    OrganizationsController,
  ],
  exports: [
    OrganizationsService,
  ],
})
export class OrganizationsModule {}
