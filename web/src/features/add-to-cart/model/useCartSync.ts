import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api';
import { addCartItem, updateCartItem } from '../api/cartWriteApi';

/**
 * Đồng bộ một thay đổi giỏ hàng lên backend (BR-28).
 *
 * Server là nguồn sự thật của FR-08, nên sau mỗi thay đổi phải làm mới
 * lại câu trả lời `GET /api/carts/me` — badge, trang giỏ và trang thanh toán
 * đọc cùng một cache nên tự đồng bộ.
 */
export function useCartSync() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
  }, [queryClient]);

  /** Gửi một món mới lên backend (BR-28). */
  const addLine = useCallback(
    async (productId: string, quantity: number) => {
      await addCartItem({ productId, quantity });
      await invalidate();
    },
    [invalidate],
  );

  /** Đổi số lượng của một món đã có trên server (BR-28). */
  const changeLine = useCallback(
    async (itemId: string, quantity: number) => {
      await updateCartItem(itemId, quantity);
      await invalidate();
    },
    [invalidate],
  );

  return { addLine, changeLine, invalidate };
}

/** Query key của giỏ hàng — dùng khi cần làm mới một tỉnh cụ thể. */
export function cartQueryKey(provinceCode: string) {
  return queryKeys.cart.mine(provinceCode);
}
