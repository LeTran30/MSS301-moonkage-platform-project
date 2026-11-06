import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeRegistrationFee } from '../changeRegistrationFeeApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature configure-registration-fee - changeRegistrationFeeApi (FR-53)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('changeRegistrationFee đặt mức phí mới cho quản trị', async () => {
    const put = vi
      .spyOn(apiClient, 'put')
      .mockResolvedValue(envelope({ amount: 500000, effectiveFrom: '2026-11-02T00:00:00Z' }) as never);

    await changeRegistrationFee(500000);

    expect(put.mock.calls[0][0]).toBe('/api/registration-fee-config');
    expect(put.mock.calls[0][1]).toEqual({ amount: 500000 });
  });
});
