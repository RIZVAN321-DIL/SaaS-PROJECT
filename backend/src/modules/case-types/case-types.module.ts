import { Module } from '@nestjs/common';
import { CaseTypesService } from './case-types.service';
import { CaseTypesController } from './case-types.controller';
import { PrismaModule } from '../../database/prisma.module';
import { CaseStageModule } from '../case-stage/case-stage.module';

@Module({
  imports: [PrismaModule, CaseStageModule],
  providers: [CaseTypesService],
  controllers: [CaseTypesController],
  exports: [CaseTypesService],
})
export class CaseTypesModule {}
