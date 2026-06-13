// src/modules/documents/document-encryption.service.ts

import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

@Injectable()
export class DocumentEncryptionService {
  private readonly algorithm =
    'aes-256-gcm';

  private readonly key: Buffer;

  constructor() {
    const secret =
      process.env.DOCUMENT_ENCRYPTION_KEY;

    if (!secret) {
      throw new Error(
        'DOCUMENT_ENCRYPTION_KEY is not defined',
      );
    }

    this.key = createHash('sha256')
      .update(secret)
      .digest();
  }

  // =========================
  // ENCRYPT BUFFER
  // =========================
  encrypt(buffer: Buffer) {
    try {
      const iv = randomBytes(16);

      const cipher = createCipheriv(
        this.algorithm,
        this.key,
        iv,
      );

      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final(),
      ]);

      const authTag =
        cipher.getAuthTag();

      return Buffer.concat([
        iv,
        authTag,
        encrypted,
      ]);
    } catch {
      throw new InternalServerErrorException(
        'Failed to encrypt document',
      );
    }
  }

  // =========================
  // DECRYPT BUFFER
  // =========================
  decrypt(buffer: Buffer) {
    try {
      const iv = buffer.subarray(0, 16);

      const authTag =
        buffer.subarray(16, 32);

      const encrypted =
        buffer.subarray(32);

      const decipher =
        createDecipheriv(
          this.algorithm,
          this.key,
          iv,
        );

      decipher.setAuthTag(authTag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
    } catch {
      throw new InternalServerErrorException(
        'Failed to decrypt document',
      );
    }
  }
}
