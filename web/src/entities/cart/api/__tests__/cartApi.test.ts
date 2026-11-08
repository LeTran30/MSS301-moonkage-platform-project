import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cartApi, mapCartDtoToEntity } from '../cartApi';
import { apiClient } from '@/shared/api';
import { clearTokens, storeTokens } from '@/shared/api/tokenVault';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Cart Entity - cartApi (T-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearTokens();
  });

  it('cartApi.getMine() bóc envelope của backend và gửi provinceCode bắt buộc', async () => {
    // Giỏ là dữ liệu của tài khoản đang đăng nhập: cần token trong vault.
    storeTokens('access-token-test');

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

  /*
   * Khách (chưa đăng nhập) không có giỏ. Gọi `GET /api/carts/me` lúc đó chỉ
   * nhận 401 và làm trang giỏ hiện "Network Error" thay vì trạng thái rỗng —
   * nên phải bỏ qua request và trả giỏ rỗng ngay.
   */
  it('khách chưa đăng nhập thì không gọi API, trả giỏ rỗng', async () => {
    clearTokens();
    const get = vi.spyOn(apiClient, 'get');

    const cart = await cartApi.getMine('Hà Nội');

    expect(cart).toEqual({ groups: [] });
    expect(get).not.toHaveBeenCalled();
  });
});
