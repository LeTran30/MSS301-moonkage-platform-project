import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interprovinceFeeApi } from '../interprovinceFeeApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

const TABLE_DTO = {
  fees: [
    {
      provinceCode: '01',
      provinceName: 'Hà Nội',
      fee: 35000,
      effectiveFrom: '2026-11-01T00:00:00Z',
    },
    {
      provinceCode: '79',
      provinceName: 'TP Hồ Chí Minh',
      fee: 45000,
      effectiveFrom: '2026-11-01T00:00:00Z',
    },
  ],
  complete: true,
};

describe('InterprovinceFee Entity - interprovinceFeeApi (FR-52, A-18)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getTable đọc cả bảng qua path định tuyến riêng của gateway', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(TABLE_DTO) as never);

    const table = await interprovinceFeeApi.getTable();

    expect(get).toHaveBeenCalledWith('/api/interprovince-fees');
    expect(table.complete).toBe(true);
    expect(table.fees[0].fee).toBe(35000);
  });

  it('getTable giữ null khi một tỉnh chưa được cấu hình (không phải miễn phí)', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        fees: [{ provinceCode: '01', provinceName: 'Hà Nội', fee: null }],
        complete: false,
      }) as never,
    );

    const table = await interprovinceFeeApi.getTable();

    expect(table.complete).toBe(false);
    expect(table.fees[0].fee).toBeNull();
  });

  it('getProvinceFee đọc đúng một tỉnh', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(TABLE_DTO.fees[1]) as never);

    const fee = await interprovinceFeeApi.getProvinceFee('79');

    expect(get).toHaveBeenCalledWith('/api/interprovince-fees/provinces/79');
    expect(fee.fee).toBe(45000);
  });
});
