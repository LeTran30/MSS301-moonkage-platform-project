import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAddress, deleteAddress, updateAddress } from '../addressWriteApi';
import * as envModule from '@/shared/config/env';
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

describe('Feature edit-address - addressWriteApi (FR-03, M6.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('createAddress gửi POST /api/addresses và trả về địa chỉ đã lưu', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(envelope(ADDRESS_DTO) as never);

    const payload = {
      recipientName: 'Chị Lan',
      recipientPhone: '0918889999',
      provinceCode: '01',
      provinceName: 'Hà Nội',
      wardName: 'Ba Đình',
      detail: '29 Liễu Giai',
      label: 'Văn phòng',
      isDefault: true,
    };
    const saved = await createAddress(payload);

    expect(post).toHaveBeenCalledWith('/identity-service/api/addresses', payload);
    expect(saved.id).toBe('addr-1');
    expect(saved.isDefault).toBe(true);
  });

  it('updateAddress gửi PUT /api/addresses/{addressId}', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue(envelope(ADDRESS_DTO) as never);

    await updateAddress('addr-1', {
      recipientName: 'Chị Lan',
      recipientPhone: '0918889999',
      provinceCode: '01',
      provinceName: 'Hà Nội',
      wardName: 'Ba Đình',
      detail: '29 Liễu Giai',
    });

    expect(put.mock.calls[0][0]).toBe('/identity-service/api/addresses/addr-1');
  });

  it('deleteAddress gọi DELETE và không cần unwrap (BE trả 204)', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined as never);

    await deleteAddress('addr-1');

    expect(del).toHaveBeenCalledWith('/identity-service/api/addresses/addr-1');
  });
});
