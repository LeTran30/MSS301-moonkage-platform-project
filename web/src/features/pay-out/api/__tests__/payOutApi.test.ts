import { describe, it, expect, vi, beforeEach } from 'vitest';
import { payOutLedger } from '../payOutApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature pay-out - payOutApi (FR-48)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('payOutLedger() gọi PUT và trả về kết quả chi trả (FR-48)', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue(
      envelope({ orderId: 'ord-1', amount: 4_200_000, paidAt: '2026-11-02T00:00:00Z' }) as never
    );

    const payout = await payOutLedger('ord-1');

    expect(put).toHaveBeenCalledWith('/payment-service/api/ledgers/ord-1/payout');
    expect(payout?.amount).toBe(4_200_000);
  });
});
