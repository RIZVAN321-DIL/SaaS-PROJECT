import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/**
 * Универсальная обёртка над S3-совместимым хранилищем.
 * Работает с AWS S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces,
 * self-hosted MinIO — всё определяется переменными окружения:
 *
 * S3_BUCKET — обязательно
 * S3_ACCESS_KEY_ID — обязательно
 * S3_SECRET_ACCESS_KEY — обязательно
 * S3_REGION — опционально (по умолчанию "auto", подходит для R2)
 * S3_ENDPOINT — опционально. ПУСТО для AWS S3.
 *   Для R2/Spaces/B2/MinIO — URL эндпоинта провайдера.
 */
@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const bucket = this.config.get<string>('S3_BUCKET');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const region = this.config.get<string>('S3_REGION') || 'auto';

    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.',
      );
    }

    this.bucket = bucket;

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(
    key: string,
    body: Buffer,
    contentType = 'application/octet-stream',
  ): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to upload ${key}`, err as Error);
      throw new InternalServerErrorException(
        'Не удалось загрузить файл в хранилище',
      );
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const stream = result.Body as Readable;
      return await this.streamToBuffer(stream);
    } catch (err) {
      this.logger.error(`Failed to download ${key}`, err as Error);
      throw new InternalServerErrorException(
        'Не удалось получить файл из хранилища',
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err) {
      this.logger.warn(`Failed to delete ${key}: ${(err as Error).message}`);
    }
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
        }
