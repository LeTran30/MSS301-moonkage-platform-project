import { lazy, Suspense, type ComponentType } from 'react';
import { LoadingState } from '../shared/ui';

/** Element of a lazily loaded page: each page is its own chunk; `name` is the page's named export. */
export function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  const Page = lazy(async () => {
    try {
      const module = await load();
      return { default: module[name] as ComponentType };
    } catch (error) {
      // If dynamic import failed (e.g. Vite dev server restart or new chunk deploy), auto-reload once
      const isChunkError =
        error instanceof Error &&
        /loading dynamically imported module|failed to fetch dynamically imported module/i.test(error.message);
      const key = `chunk_reload_${name}`;
      if (isChunkError && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      throw error;
    }
  });
  return (
    <Suspense fallback={<LoadingState />}>
      <Page />
    </Suspense>
  );
}
