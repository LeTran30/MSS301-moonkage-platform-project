import { lazy, Suspense, type ComponentType } from 'react';
import { PageLoader } from '@/shared/ui';

const RELOAD_KEY = 'moonkage_chunk_reload_lock';

/**
 * lazyPage: Lazy load React component với cơ chế Chunk-Reload Recovery
 * Khi deploy bản mới, các hash chunk cũ trên CDN có thể bị 404.
 * Hàm này sẽ tự động thử reload lại trang một lần để lấy bundle mới nhất
 * và dùng sessionStorage để chặn vòng lặp reload bất tận.
 *
 * Kiểu `P` là props của trang: khai báo rõ ràng để sai khác props ở ranh giới
 * định tuyến bị bắt lỗi ngay khi `tsc -b`, thay vì trôi qua `any`.
 */
export function lazyPage<P extends object = Record<string, never>>(
  factory: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P> {
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

  return function SuspenseWrappedPage(props: P) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
