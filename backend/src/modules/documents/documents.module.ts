// src/modules/documents/documents.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [
    PrismaModule,

    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],

  controllers: [DocumentsController],

  providers: [DocumentsService],

  exports: [DocumentsService],
})
export class DocumentsModule {}
