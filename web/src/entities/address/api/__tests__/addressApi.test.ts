import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addressApi } from '../addressApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

const ADDRESS_DTO = {
  id: 'addr-1',
  recipientName: 'Chị Lan',
  recipientPhone: '0918889999',
  provinceCode: '01',
  provinceName: 'Hà Nội',
  wardName: 'Ba Đình',
  detail: '29 Liễu Giai',
  fullAddress: '29 Liễu Giai, Ba Đình, Hà Nội',
  areaCode: '01',
  label: 'Văn phòng',
  isDefault: true,
};

describe('Address Entity - addressApi (FR-03)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('list đọc GET /api/addresses của identity-service', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope([ADDRESS_DTO]) as never);

    const addresses = await addressApi.list();

    expect(get).toHaveBeenCalledWith('/identity-service/api/addresses');
    expect(addresses).toHaveLength(1);
    expect(addresses[0].recipientName).toBe('Chị Lan');
    expect(addresses[0].isDefault).toBe(true);
    expect(addresses[0].fullAddress).toBe('29 Liễu Giai, Ba Đình, Hà Nội');
  });

  it('list trả về mảng rỗng khi máy chủ không có địa chỉ nào', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(envelope([]) as never);

    await expect(addressApi.list()).resolves.toEqual([]);
  });
});
