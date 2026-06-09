import { Module } from '@nestjs/common';
import { CaseStageService } from './case-stage.service';
import { CaseStageController } from './case-stage.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CaseStageController],
  providers: [CaseStageService, PrismaService],
})
export class CaseStageModule {}
