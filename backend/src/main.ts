import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';

function validateEnv(logger: Logger) {
  const INSECURE_MARKERS = ['change-me', 'secret', 'example', 'placeholder'];
  const REQUIRED_SECRETS = ['JWT_SECRET', 'DOCUMENT_ENCRYPTION_KEY'];

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  let hasError = false;

  for (const key of REQUIRED_SECRETS) {
    const value = process.env[key] ?? '';
    if (!value) {
      logger.error(`❌  Переменная окружения ${key} не задана`);
      hasError = true;
      continue;
    }
    if (value.length < 32) {
      logger.error(`❌  ${key} слишком короткий (минимум 32 символа)`);
      hasError = true;
    }
    if (INSECURE_MARKERS.some((m) => value.toLowerCase().includes(m))) {
      logger.error(`❌  ${key} содержит дефолтное/небезопасное значение`);
      hasError = true;
    }
  }

  if (hasError) {
    logger.error('Приложение не запущено: обнаружены небезопасные переменные окружения');
    process.exit(1);
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  validateEnv(logger);

  try {
    logger.log('Синхронизация схемы БД...');
    await execAsync('prisma db push --accept-data-loss');
    logger.log('Схема синхронизирована успешно');
  } catch (err) {
    logger.error('Синхронизация не удалась — приложение остановлено');
    logger.error(String(err));
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Делаем владельца CRM платформенным админом
  try {
    const prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "isPlatformAdmin" = true WHERE "email" = 'rizvandilyaverovich@gmail.com'`
    );
    logger.log('✅  Платформенный админ назначен');
  } catch (err) {
    logger.warn('⚠️  Не удалось назначить платформенного админа (возможно, пользователь ещё не создан)');
  }

  app.use(helmet());

  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} не разрешён`));
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  logger.log(`✅  Приложение запущено на порту ${port}`);
  logger.log(`    API: http://localhost:${port}/api`);
}

bootstrap();
