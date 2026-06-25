import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DocumentEncryptionService } from './document-encryption.service';
import { S3StorageService } from './s3-storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly encryption: DocumentEncryptionService,
    private readonly storage: S3StorageService,
  ) {}

  // =========================
  // UPLOAD
  // =========================
  async uploadFile(data: {
    organizationId: string;
    caseId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    uploadedById?: string;
  }) {
    const caseItem = await this.prisma.case.findFirst({
      where: { id: data.caseId, organizationId: data.organizationId },
    });

    if (!caseItem) {
      throw new NotFoundException('Дело не найдено');
    }

    const encrypted = this.encryption.encrypt(data.buffer);
    const storageKey = `documents/${data.organizationId}/${data.caseId}/${crypto.randomUUID()}.enc`;

    await this.storage.upload(storageKey, encrypted, 'application/octet-stream');

    const document = await this.prisma.document.create({
      data: {
        organizationId: data.organizationId,
        caseId: data.caseId,
        name: data.fileName,
        type: 'encrypted',
        mimeType: data.mimeType,
        fileSize: data.buffer.length,
        uploadedAt: new Date(),
        uploadedById: data.uploadedById,
        fileUrl: storageKey,
      },
    });

    if (data.uploadedById) {
      await this.audit.log({
        organizationId: data.organizationId,
        userId: data.uploadedById,
        action: 'DOCUMENT_UPLOADED',
        entity: 'Document',
        entityId: document.id,
        meta: { name: document.name, caseId: data.caseId },
      });
    }

    return document;
  }

  // =========================
  // DOWNLOAD
  // =========================
  async downloadFile(id: string, organizationId: string) {
    const document = await this.findById(id, organizationId);

    if (!document.fileUrl) {
      throw new NotFoundException('Файл не найден в хранилище');
    }

    const encrypted = await this.storage.download(document.fileUrl);
    const decrypted = this.encryption.decrypt(encrypted);

    return {
      name: document.name,
      mimeType: document.mimeType || document.type || 'application/octet-stream',
      buffer: decrypted,
    };
  }

  // =========================
  // CREATE (без загрузки файла)
  // =========================
  async create(data: {
    organizationId: string;
    caseId: string;
    name: string;
    fileUrl?: string;
    type?: string;
  }) {
    const caseItem = await this.prisma.case.findFirst({
      where: { id: data.caseId, organizationId: data.organizationId },
    });

    if (!caseItem) {
      throw new NotFoundException('Дело не найдено');
    }

    return this.prisma.document.create({ data });
  }

  // =========================
  // FIND ALL
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.document.findMany({
      where: { organizationId },
      include: { case: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // FIND ONE
  // =========================
  async findById(id: string, organizationId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, organizationId },
      include: { case: true },
    });

    if (!doc) {
      throw new NotFoundException('Документ не найден');
    }

    return doc;
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string, organizationId: string, userId?: string) {
    const document = await this.findById(id, organizationId);

    if (document.fileUrl) {
      await this.storage.delete(document.fileUrl);
    }

    const removed = await this.prisma.document.delete({ where: { id } });

    if (userId) {
      await this.audit.log({
        organizationId,
        userId,
        action: 'DOCUMENT_DELETED',
        entity: 'Document',
        entityId: id,
        meta: { name: document.name, caseId: document.caseId },
      });
    }

    return removed;
  }
  }
