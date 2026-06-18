// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

import { Inter } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { ToastBridge } from '@/components/providers/toast-bridge';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Legal CRM Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <ToastBridge />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
