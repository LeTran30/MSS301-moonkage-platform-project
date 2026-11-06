import { describe, it, expect, vi, beforeEach } from 'vitest';
import { confirmManualRefund } from '../confirmRefundApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature resolve-disputes - confirmManualRefund (AC-49.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('admin xác nhận hoàn tiền tay bằng PATCH', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({ refundId: 'ref-1', amount: 500000, status: 'SUCCEEDED' }) as never,
    );

    const refund = await confirmManualRefund('ref-1');

    expect(patch).toHaveBeenCalledWith('/payment-service/api/refunds/ref-1');
    expect(refund?.status).toBe('SUCCEEDED');
  });
});
