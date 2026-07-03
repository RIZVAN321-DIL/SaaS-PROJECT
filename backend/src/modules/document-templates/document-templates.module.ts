import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';

import { DocumentTemplatesService } from './document-templates.service';
import { DocumentTemplatesController } from './document-templates.controller';

@Module({
  imports: [PrismaModule],
  providers: [DocumentTemplatesService],
  controllers: [DocumentTemplatesController],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}
