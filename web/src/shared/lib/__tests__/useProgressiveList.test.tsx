import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgressiveList } from '../useProgressiveList';

describe('Shared lib - useProgressiveList', () => {
  const items = Array.from({ length: 50 }, (_, i) => i);

  it('ban đầu chỉ hiện trang đầu', () => {
    const { result } = renderHook(() => useProgressiveList(items, 10));

    expect(result.current.visibleItems).toHaveLength(10);
    expect(result.current.visibleItems[0]).toBe(0);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.total).toBe(50);
  });

  it('loadMore nối tiếp trang kế', () => {
    const { result } = renderHook(() => useProgressiveList(items, 10));

    act(() => result.current.loadMore());
    expect(result.current.visibleItems).toHaveLength(20);

    act(() => result.current.loadMore());
    expect(result.current.visibleItems).toHaveLength(30);
  });

  it('không vượt quá độ dài danh sách', () => {
    const { result } = renderHook(() => useProgressiveList(items, 10));

    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    act(() => result.current.loadMore());

    expect(result.current.visibleItems).toHaveLength(50);
    expect(result.current.hasMore).toBe(false);
  });

  it('danh sách ngắn hơn trang đầu thì hiện hết, không có hasMore', () => {
    const { result } = renderHook(() => useProgressiveList([1, 2, 3], 10));

    expect(result.current.visibleItems).toHaveLength(3);
    expect(result.current.hasMore).toBe(false);
  });

  it('đổi danh sách thì quay lại trang đầu', () => {
    const { result, rerender } = renderHook(
      ({ list }: { list: number[] }) => useProgressiveList(list, 10),
      { initialProps: { list: items } },
    );

    act(() => result.current.loadMore());
    expect(result.current.visibleItems).toHaveLength(20);

    rerender({ list: [1, 2, 3] });
    expect(result.current.visibleItems).toHaveLength(3);
    expect(result.current.hasMore).toBe(false);
  });

  it('danh sách rỗng thì không hiện gì', () => {
    const { result } = renderHook(() => useProgressiveList([], 10));

    expect(result.current.visibleItems).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });
});
