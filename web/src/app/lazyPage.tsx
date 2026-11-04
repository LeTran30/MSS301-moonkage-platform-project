import { lazy, Suspense, type ComponentType } from 'react';
import { PageLoader } from '@/shared/ui';

const RELOAD_KEY = 'moonkage_chunk_reload_lock';

/**
 * lazyPage: Lazy load React component với cơ chế Chunk-Reload Recovery
 * Khi deploy bản mới, các hash chunk cũ trên CDN có thể bị 404.
 * Hàm này sẽ tự động thử reload lại trang một lần để lấy bundle mới nhất
 * và dùng sessionStorage để chặn vòng lặp reload bất tận.
 */
export function lazyPage<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): ComponentType {
  const LazyComponent = lazy(async () => {
    try {
      const module = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return module;
    } catch (error) {
      const hasReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (!hasReloaded) {
        sessionStorage.setItem(RELOAD_KEY, 'true');
        window.location.reload();
      }
      throw error;
    }
  });

  return function SuspenseWrappedPage(props: any) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
