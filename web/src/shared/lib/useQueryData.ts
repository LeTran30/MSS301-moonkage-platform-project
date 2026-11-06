import { useCallback } from 'react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import type { AsyncStateKind } from '@/shared/ui';

/**
 * Đọc dữ liệu qua query cache, với đúng hợp đồng mà `useAsync` đã có.
 *
 * Vì sao không dùng `useQuery` trực tiếp: toàn bộ 34 call site đang dùng
 * `AsyncStateKind<T>` (`kind: 'loading' | 'error' | 'loaded'`), và `AsyncState`
 * trong design system nhận đúng kiểu đó. Hook này giữ nguyên hợp đồng nên
 * **không phải sửa một call site nào** ở phía dưới.
 *
 * Khác biệt so với `useAsync`:
 * - Cùng một `queryKey` chỉ gọi API **một lần**, kể cả khi nhiều màn hình cùng
 *   dùng (đây là điều đã gỡ ở `CatalogBootstrap` vs `CatalogPage`).
 * - Có cache: quay lại màn hình đã xem thì hiện dữ liệu tức thì, không chờ loading.
 * - `reload()` giờ là `refetch()`: dữ liệu cũ vẫn hiển thị trong lúc tải lại.
 */
export function useQueryData<T>(
  queryKey: QueryKey,
  load: () => Promise<T>,
  options?: { enabled?: boolean },
): AsyncStateKind<T> & { reload: () => void } {
  const query = useQuery({
    queryKey,
    queryFn: load,
    enabled: options?.enabled,
  });

  // `reload` phải giữ nguyên identity giữa các lần render, nếu không thì
  // `useCallback` ở hook cha (ví dụ `useAdminOverview`) sẽ tạo lại hàm mới
  // mỗi lần render và kéo theo vòng render lặp.
  const { refetch } = query;
  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (query.isPending) {
    return { kind: 'loading', reload };
  }

  if (query.isError) {
    const error = query.error;
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Đã có sự cố xảy ra khi kết nối máy chủ.';
    return { kind: 'error', message, reload };
  }

  return { kind: 'loaded', data: query.data as T, reload };
}
