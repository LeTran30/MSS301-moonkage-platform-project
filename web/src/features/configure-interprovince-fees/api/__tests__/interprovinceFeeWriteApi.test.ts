import { describe, it, expect, vi, beforeEach } from 'vitest';
import { replaceFeeTable } from '../interprovinceFeeWriteApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

const TABLE_DTO = {
  fees: [
    { provinceCode: '01', provinceName: 'Hà Nội', fee: 35000, effectiveFrom: '2026-11-01T00:00:00Z' },
    { provinceCode: '79', provinceName: 'TP Hồ Chí Minh', fee: 45000, effectiveFrom: '2026-11-01T00:00:00Z' },
  ],
  complete: true,
};

describe('Feature configure-interprovince-fees - replaceFeeTable (AC-52.1, AC-52.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('gửi PUT với danh sách fees và trả về bảng máy chủ đã lưu', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue(envelope(TABLE_DTO) as never);

    const table = await replaceFeeTable([
      { provinceCode: '01', fee: 35000 },
      { provinceCode: '79', fee: 45000 },
    ]);

    expect(put).toHaveBeenCalledWith('/api/interprovince-fees', {
      fees: [
        { provinceCode: '01', fee: 35000 },
        { provinceCode: '79', fee: 45000 },
      ],
    });
    expect(table.fees).toHaveLength(2);
  });
});
