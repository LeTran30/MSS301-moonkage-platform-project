import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCartItem, updateCartItem } from '../cartWriteApi';
import { apiClient } from '@/shared/api';

describe('Feature add-to-cart - cartWriteApi (FR-08, BR-28)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('addCartItem() gửi POST đúng endpoint cart items', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined as never);

    await addCartItem({ productId: 'p-1', quantity: 2 });

    expect(post).toHaveBeenCalledWith('/order-service/api/carts/me/items', {
      productId: 'p-1',
      quantity: 2,
    });
  });

  it('updateCartItem() gửi PATCH đúng endpoint của dòng giỏ', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(undefined as never);

    await updateCartItem('line-1', 3);

    expect(patch).toHaveBeenCalledWith('/order-service/api/carts/me/items/line-1', { quantity: 3 });
  });
});
