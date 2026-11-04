import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Render dần danh sách dài (progressive rendering) thay vì đổ tất cả vào DOM.
 *
 * Vấn đề: danh mục có thể có hàng trăm sản phẩm. Dựng tất cả thẻ sản phẩm
 * cùng lúc tốn nhiều thời gian paint và làm trang giật trên máy yếu, nhất là
 * trên điện thoại.
 *
 * Cách này nhẹ hơn thư viện virtualization đầy đủ (không cần đo chiều cao
 * từng item) và phù hợp với lưới sản phẩm: hiển thị trang đầu, cuộn xuống
 * thì nối tiếp trang kế. Người dùng vẫn thấy đủ danh sách, chỉ là DOM được
 * dựng dần.
 *
 * ```tsx
 * const { visibleItems, hasMore, loadMore } = useProgressiveList(filteredProducts, 24);
 * ```
 */
export function useProgressiveList<T>(items: readonly T[], pageSize = 24) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Khi danh sách đổi (đổi bộ lọc, tìm kiếm) hoặc kích thước trang đổi,
  // quay lại trang đầu.
  //
  // Điều chỉnh state *trong lúc render* (mẫu "adjusting state when a prop
  // changes" của React) thay vì `useEffect`: effect sẽ chạy thêm một vòng
  // render, tức là danh sách dài bị dựng 2 lần thay vì 1 lần.
  const listKey = items.length;
  const [prevListKey, setPrevListKey] = useState(listKey);
  const [prevPageSize, setPrevPageSize] = useState(pageSize);

  if (prevListKey !== listKey || prevPageSize !== pageSize) {
    setPrevListKey(listKey);
    setPrevPageSize(pageSize);
    setVisibleCount(pageSize);
  }

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  const hasMore = visibleCount < items.length;

  const loadMore = () => {
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  };

  // Tự nạp thêm khi người dùng cuộn tới cuối danh sách.
  useEffect(() => {
    if (!hasMore) return;

    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: '400px' },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  });

  return { visibleItems, hasMore, loadMore, sentinelRef, total: items.length };
}
