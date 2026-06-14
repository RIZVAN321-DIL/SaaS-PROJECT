'use client';

import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (open) {
      document.addEventListener(
        'keydown',
        handleEscape,
      );
    }

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 text-lg font-semibold">
            {title}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
