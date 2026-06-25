import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Запускаем миграцию перед стартом
  try {
    logger.log('Running database migration...');
    await execAsync('prisma migrate deploy');
    logger.log('Migration completed');
  } catch (err) {
    logger.error('Migration failed, continuing anyway');
  }

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // =========================
  // SECURITY
  // =========================
  app.use(helmet());

  // =========================
  // CORS
  // Разрешаем только конкретный фронтенд, не wildcard.
  // origin: true зеркалировало любой Origin — уязвимость CSRF.
  // =========================
  const allowedOrigin =
    process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: (origin, callback) => {
      // разрешаем запросы без Origin (curl, мобильные клиенты, Postman)
      // и только наш фронтенд
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  });

  // =========================
  // API PREFIX
  // =========================
  app.setGlobalPrefix('api');

  // =========================
  // GLOBAL VALIDATION
  // =========================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // =========================
  // PROXY SUPPORT
  // =========================
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // =========================
  // SHUTDOWN HOOKS
  // =========================
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  logger.log(`Application started`);
  logger.log(`Port: ${port}`);
  logger.log(`API: http://localhost:${port}/api`);
}

bootstrap();
