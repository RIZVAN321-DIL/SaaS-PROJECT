// Файл 1: frontend/next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },
};

// withSentryConfig оборачивает сборку, чтобы прикрепить source maps и
// сконфигурировать трассировку запросов. Если SENTRY_ORG/SENTRY_PROJECT
// не заданы — просто не будет загрузки source maps на сервер Sentry,
// сама сборка при этом не ломается.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
