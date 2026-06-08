import { Module } from '@nestjs/common';
import { CaseTypesService } from './case-types.service';
import { CaseTypesController } from './case-types.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CaseTypesService],
  controllers: [CaseTypesController],
  exports: [CaseTypesService],
})
export class CaseTypesModule {}
