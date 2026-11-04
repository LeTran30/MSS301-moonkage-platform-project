import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeCartItem } from '../removeCartItemApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';

describe('Feature remove-cart-item - removeCartItemApi (FR-08)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('gửi DELETE đúng endpoint của dòng giỏ (204, không có body)', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined as never);

    await removeCartItem('line-1');

    expect(del).toHaveBeenCalledWith('/order-service/api/carts/me/items/line-1');
  });
});
