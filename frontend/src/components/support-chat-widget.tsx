'use client';

import Script from 'next/script';
import { getUser } from '@/lib/auth';

declare global {
  interface Window {
    Tawk_API?: {
      setAttributes: (
        attrs: Record<string, string>,
        callback?: (error?: unknown) => void,
      ) => void;
    };
  }
}

// ID виджета Tawk.to берётся из личного кабинета tawk.to (Administration → Chat Widget).
// Формат переменной: "<propertyId>/<widgetId>", например "64f1a2.../1h9abc123".
// Если переменная не задана — компонент ничего не рендерит, приложение работает как раньше.
const TAWKTO_WIDGET_ID = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

export function SupportChatWidget() {
  if (!TAWKTO_WIDGET_ID) return null;

  return (
    <Script
      id="tawkto-widget"
      strategy="afterInteractive"
      src={`https://embed.tawk.to/${TAWKTO_WIDGET_ID}`}
      onLoad={() => {
        // Если пользователь залогинен — передаём в чат его email,
        // чтобы вы сразу видели, кто пишет, без лишних вопросов.
        const user = getUser();
        if (user && window.Tawk_API) {
          window.Tawk_API.setAttributes({ email: user.email, role: user.role });
        }
      }}
    />
  );
}
