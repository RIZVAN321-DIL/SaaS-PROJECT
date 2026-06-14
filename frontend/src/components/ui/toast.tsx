'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(
    message: string,
    type: ToastType = 'info',
  ) {
    const id = crypto.randomUUID();

    const toast: Toast = {
      id,
      message,
      type,
    };

    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((t) => t.id !== id),
      );
    }, 3000);
  }

  function remove(id: string) {
    setToasts((prev) =>
      prev.filter((t) => t.id !== id),
    );
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed right-4 top-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => remove(toast.id)}
            className={`
              cursor-pointer
              rounded-xl
              px-4
              py-3
              text-sm
              shadow-lg
              border
              bg-background
              ${
                toast.type === 'success'
                  ? 'border-green-500'
                  : toast.type === 'error'
                  ? 'border-red-500'
                  : 'border-border'
              }
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return ctx;
}
