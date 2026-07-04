import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Если NEXT_PUBLIC_SENTRY_DSN не задан, Sentry.init тихо ничего не делает —
  // это безопасно оставить пустым в окружениях, где мониторинг пока не нужен.
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
});
