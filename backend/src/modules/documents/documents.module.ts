import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../database/prisma.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentEncryptionService } from './document-encryption.service';
import { S3StorageService } from './s3-storage.service';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  ],
  controllers: [
    DocumentsController,
  ],
  providers: [
    DocumentsService,
    DocumentEncryptionService,
    S3StorageService,
  ],
  exports: [
    DocumentsService,
    DocumentEncryptionService,
    S3StorageService,
  ],
})
export class DocumentsModule {}
