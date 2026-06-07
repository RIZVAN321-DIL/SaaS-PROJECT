import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // создаём Nest приложение
  const app = await NestFactory.create(AppModule);

  // глобальная валидация DTO (очень важно для SaaS)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // убирает лишние поля
      transform: true, // автоматически преобразует типы
      forbidNonWhitelisted: true, // запрещает лишние поля
    }),
  );

  // префикс API (все запросы будут начинаться с /api)
  app.setGlobalPrefix('api');

  // включаем CORS (frontend будет подключаться)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // порт
  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 CRM SaaS backend running on http://localhost:${port}`);
}

bootstrap();
