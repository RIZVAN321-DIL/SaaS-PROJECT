import { Module } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { CustomFieldsController } from './custom-fields.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CustomFieldsService],
  controllers: [CustomFieldsController],
  exports: [CustomFieldsService],
})
export class CustomFieldsModule {}
