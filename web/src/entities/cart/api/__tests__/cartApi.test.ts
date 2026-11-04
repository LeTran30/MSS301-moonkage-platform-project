import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cartApi, mapCartDtoToEntity } from '../cartApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Cart Entity - cartApi (T-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('cartApi.getMine() trả về dữ liệu cartStore khi isDemoMode() = true', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(true);
    const cart = await cartApi.getMine();
    expect(cart).toHaveProperty('groups');
  });

  it('cartApi.getMine() bóc envelope của backend và gửi provinceCode bắt buộc', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        provinceCode: '01',
        totalAmount: 530000,
        groups: [
          {
            vendorId: 'ven-1',
            vendorName: 'Xưởng Cô Hoa',
            shippingFee: 25000,
            subtotal: 500000,
            items: [
              {
                itemId: 'line-1',
                productId: 'p-1',
                productName: 'Bánh nướng',
                unitPrice: 250000,
                quantity: 2,
                available: true,
              },
            ],
          },
        ],
      }),
    );

    const cart = await cartApi.getMine('Hà Nội');
    expect(cart.groups).toHaveLength(1);
    expect(cart.groups[0].vendorId).toBe('ven-1');
    expect(cart.groups[0].shippingFee).toBe(25000);
    expect(cart.groups[0].items[0].name).toBe('Bánh nướng');
    expect(cart.groups[0].items[0].quantity).toBe(2);

    const calledUrl = get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('provinceCode=01');
  });

  it('mapCartDtoToEntity xử lý giỏ rỗng', () => {
    expect(mapCartDtoToEntity({ groups: [] })).toEqual({ groups: [] });
  });
});
