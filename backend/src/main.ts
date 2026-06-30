import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { AppModule } from './app.module';

// =========================
// ВАЛИДАЦИЯ СЕКРЕТОВ ПРИ СТАРТЕ
// Если в продакшене остались дефолтные значения — не стартуем.
// =========================
function validateEnv(logger: Logger) {
  const INSECURE_MARKERS = ['change-me', 'secret', 'example', 'placeholder'];
  const REQUIRED_SECRETS = ['JWT_SECRET', 'DOCUMENT_ENCRYPTION_KEY'];

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return; // в dev/test разрешаем любые значения

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

  // Проверяем секреты до создания приложения
  validateEnv(logger);

  // =========================
  // МИГРАЦИЯ БД
  // Если миграция упала — приложение НЕ стартует.
  // Это безопаснее, чем работать со старой схемой.
  // =========================
  try {
    logger.log('Запуск миграции БД...');
    await execAsync('prisma migrate deploy');
    logger.log('Миграция завершена успешно');
  } catch (err) {
    logger.error('Миграция завершилась с ошибкой — приложение остановлено');
    logger.error(String(err));
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });

  // =========================
  // SECURITY
  // =========================
  app.use(helmet());

  // =========================
  // CORS — только конкретный фронтенд, не wildcard
  // =========================
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

  // =========================
  // API PREFIX
  // =========================
  app.setGlobalPrefix('api');

  // =========================
  // GLOBAL VALIDATION PIPE
  // =========================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // =========================
  // PROXY SUPPORT (для Render/Heroku/etc.)
  // =========================
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // =========================
  // GRACEFUL SHUTDOWN
  // =========================
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  logger.log(`✅  Приложение запущено на порту ${port}`);
  logger.log(`    API: http://localhost:${port}/api`);
}

bootstrap();
