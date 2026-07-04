import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

// Ловит вообще любое исключение во всех контроллерах. Отправляет его
// в Sentry (если SENTRY_DSN не задан — Sentry.captureException просто
// ничего не делает), а затем передаёт обработку дальше в стандартный
// механизм Nest, чтобы ответ клиенту не изменился.
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    super.catch(exception, host);
  }
}
