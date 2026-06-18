// frontend/src/components/providers/toast-bridge.tsx (новый файл)
'use client';

import { useEffect } from 'react';

import { toast } from '@/lib/toast';
import { useToast } from '@/components/ui/toast';

export function ToastBridge() {
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = toast.subscribe(({ message, type }) => {
      showToast(message, type);
    });

    return unsubscribe;
  }, [showToast]);

  return null;
}
