import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../../database/prisma.module';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [PrismaModule, CustomFieldsModule],
  providers: [ClientsService],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
