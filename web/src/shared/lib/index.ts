import { useSyncExternalStore } from 'react';

/** Ghép class, bỏ giá trị rỗng. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
};

/** Kho dữ liệu nhỏ, đồng bộ với React qua useSyncExternalStore. Có thể lưu vào localStorage. */
export function createStore<T>(initial: T, persistKey?: string): Store<T> {
  let state = initial;
  if (persistKey && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      /* bỏ qua dữ liệu hỏng */
    }
  }
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next) => {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      if (persistKey) {
        try {
          localStorage.setItem(persistKey, JSON.stringify(state));
        } catch {
          /* hết dung lượng */
        }
      }
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export { useAction } from './useAction';
export { useAsync } from './useAsync';
export { useQueryData } from './useQueryData';
export { useProgressiveList } from './useProgressiveList';
export { validators } from './validators';


export { demoPaymentUrl, openPaymentPage } from './payment';
