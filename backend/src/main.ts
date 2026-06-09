import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // =========================
  // SECURITY: CORS (BASIC PRODUCTION SETUP)
  // =========================
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // =========================
  // GLOBAL VALIDATION PIPE (CRITICAL HARDENING LAYER STEP)
  // =========================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // =========================
  // START SERVER
  // =========================
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
