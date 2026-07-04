import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SupportChatWidget } from '@/components/support-chat-widget';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://caseflow.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CaseFlow — Юридическая CRM',
    template: '%s · CaseFlow',
  },
  description:
    'CaseFlow объединяет дела, клиентов, задачи, документы и процессуальные сроки юридической фирмы в одной системе с гибкими правами доступа.',
  keywords: [
    'юридическая CRM',
    'CRM для юристов',
    'управление делами юрфирмы',
    'CaseFlow',
    'учёт юридических дел',
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName: 'CaseFlow',
    title: 'CaseFlow — Юридическая CRM',
    description:
      'Все дела вашей фирмы в одном потоке: клиенты, задачи, документы и сроки под надёжной защитой.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaseFlow — Юридическая CRM',
    description: 'Все дела вашей фирмы в одном потоке.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <SupportChatWidget />
      </body>
    </html>
  );
}
