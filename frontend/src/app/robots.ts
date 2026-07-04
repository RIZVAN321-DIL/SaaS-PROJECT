import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://caseflow.example.com';

// Next.js автоматически отдаёт этот файл по адресу /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms', '/privacy'],
        // Закрываем от индексации всё, что требует авторизации —
        // поисковикам там нечего делать, а роботам middleware всё равно вернёт redirect на /login.
        disallow: [
          '/dashboard',
          '/cases',
          '/clients',
          '/tasks',
          '/settings',
          '/calendar',
          '/onboarding',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
