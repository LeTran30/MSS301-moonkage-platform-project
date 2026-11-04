import { useSyncExternalStore } from 'react';
import { generateEntityId } from '@/shared/utils';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  tone: ToastTone;
  duration?: number; // ms, mặc định 4000
  createdAt: number;
}

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function addToast(params: {
  message: string;
  title?: string;
  tone?: ToastTone;
  duration?: number;
}): string {
  const id = generateEntityId('toast', '-');
  const duration = params.duration ?? 4000;
  const newToast: ToastItem = {
    id,
    title: params.title,
    message: params.message,
    tone: params.tone || 'info',
    duration,
    createdAt: Date.now(),
  };

  toasts = [newToast, ...toasts.slice(0, 4)]; // Giữ tối đa 5 toast
  notify();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function clearToasts() {
  toasts = [];
  notify();
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => toasts,
    () => [],
  );
}

// Global convenience helper
export const toast = {
  success: (message: string, title?: string) => addToast({ message, title, tone: 'success' }),
  error: (message: string, title?: string) => addToast({ message, title, tone: 'error' }),
  warning: (message: string, title?: string) => addToast({ message, title, tone: 'warning' }),
  info: (message: string, title?: string) => addToast({ message, title, tone: 'info' }),
};
