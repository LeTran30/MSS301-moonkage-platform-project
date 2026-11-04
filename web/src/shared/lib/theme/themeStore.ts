import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'moonkage-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

let currentTheme: Theme = getInitialTheme();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function applyTheme(theme: Theme) {
  currentTheme = theme;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }
  notify();
}

export function toggleTheme(): Theme {
  const next = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

export function getTheme(): Theme {
  return currentTheme;
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => currentTheme,
    () => 'light' as Theme,
  );

  return [theme, toggleTheme];
}

// Khởi chạy đồng bộ ngay khi script load
if (typeof window !== 'undefined') {
  applyTheme(currentTheme);
}
