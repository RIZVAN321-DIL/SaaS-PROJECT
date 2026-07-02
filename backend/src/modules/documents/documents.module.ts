import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentEncryptionService } from './document-encryption.service';
import { S3StorageService } from './s3-storage.service';
import { BadRequestException } from '@nestjs/common';

// =========================
// РАЗРЕШЁННЫЕ MIME-ТИПЫ
// Исполняемые файлы (.exe, .sh, .js) загружать запрещено.
// =========================
const ALLOWED_MIME_TYPES = new Set([
  // Документы
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Текст
  'text/plain',
  'text/csv',
  // Изображения
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  // Архивы
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
]);

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    PermissionsModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 МБ
        files: 1,
      },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Недопустимый тип файла: ${file.mimetype}. ` +
              'Разрешены: PDF, Word, Excel, изображения, текстовые файлы, архивы.',
            ),
            false,
          );
        }
      },
    }),
  ],
  controllers: [DocumentsController],
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
