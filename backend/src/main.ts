import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  Logger,
} from '@nestjs/common';

import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create(AppModule);

  const logger =
    new Logger('Bootstrap');

  // =========================
  // SECURITY
  // =========================
  app.use(helmet());

  // =========================
  // CORS
  // =========================
  app.enableCors({
    origin: true,
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
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', 1);

  // =========================
  // SHUTDOWN HOOKS
  // =========================
  app.enableShutdownHooks();

  const port =
    Number(process.env.PORT) || 3000;

  await app.listen(port);

  logger.log(
    `Application started`,
  );

  logger.log(
    `Port: ${port}`,
  );

  logger.log(
    `API: http://localhost:${port}/api`,
  );
}

bootstrap();
