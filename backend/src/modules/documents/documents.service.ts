import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { DocumentEncryptionService } from './document-encryption.service';

@Injectable()
export class DocumentsService {
  private readonly uploadPath = path.join(
    process.cwd(),
    'storage',
    'documents',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: DocumentEncryptionService,
  ) {}

  // =========================
  // UPLOAD FILE
  // =========================
  async uploadFile(data: {
    organizationId: string;
    caseId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    uploadedById?: string;
  }) {
    const caseItem =
      await this.prisma.case.findFirst({
        where: {
          id: data.caseId,
          organizationId:
            data.organizationId,
        },
      });

    if (!caseItem) {
      throw new NotFoundException(
        'Case not found',
      );
    }

    await fs.mkdir(
      this.uploadPath,
      {
        recursive: true,
      },
    );

    const encrypted =
      this.encryption.encrypt(
        data.buffer,
      );

    const storageName = `${crypto.randomUUID()}.enc`;

    const filePath = path.join(
      this.uploadPath,
      storageName,
    );

    await fs.writeFile(
      filePath,
      encrypted,
    );

    return this.prisma.document.create({
      data: {
        organizationId:
          data.organizationId,

        caseId:
          data.caseId,

        name:
          data.fileName,

        type:
          'encrypted',

        mimeType:
          data.mimeType,

        fileSize:
          data.buffer.length,

        uploadedAt:
          new Date(),

        uploadedById:
          data.uploadedById,

        fileUrl:
          storageName,
      },
    });
  }

  // =========================
  // DOWNLOAD FILE
  // =========================
  async downloadFile(
    id: string,
    organizationId: string,
  ) {
    const document =
      await this.findById(
        id,
        organizationId,
      );

    if (!document.fileUrl) {
      throw new NotFoundException(
        'File not found',
      );
    }

    const filePath = path.join(
      this.uploadPath,
      document.fileUrl,
    );

    const encrypted =
      await fs.readFile(
        filePath,
      );

    const decrypted =
      this.encryption.decrypt(
        encrypted,
      );

    return {
      name: document.name,
      mimeType:
        document.mimeType ||
        document.type ||
        'application/octet-stream',
      buffer: decrypted,
    };
  }

  // =========================
  // CREATE DOCUMENT
  // =========================
  async create(data: {
    organizationId: string;
    caseId: string;
    name: string;
    fileUrl?: string;
    type?: string;
  }) {
    const caseItem =
      await this.prisma.case.findFirst({
        where: {
          id: data.caseId,
          organizationId:
            data.organizationId,
        },
      });

    if (!caseItem) {
      throw new NotFoundException(
        'Case not found',
      );
    }

    return this.prisma.document.create({
      data,
    });
  }

  // =========================
  // GET ALL DOCUMENTS
  // =========================
  async findAll(
    organizationId: string,
  ) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
      },
      include: {
        case: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================
  // GET ONE DOCUMENT
  // =========================
  async findById(
    id: string,
    organizationId: string,
  ) {
    const doc =
      await this.prisma.document.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          case: true,
        },
      });

    if (!doc) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    return doc;
  }

  // =========================
  // DELETE DOCUMENT
  // =========================
  async remove(
    id: string,
    organizationId: string,
  ) {
    const document =
      await this.findById(
        id,
        organizationId,
      );

    if (document.fileUrl) {
      const filePath = path.join(
        this.uploadPath,
        document.fileUrl,
      );

      try {
        await fs.unlink(
          filePath,
        );
      } catch {}
    }

    return this.prisma.document.delete({
      where: {
        id,
      },
    });
  }
}
