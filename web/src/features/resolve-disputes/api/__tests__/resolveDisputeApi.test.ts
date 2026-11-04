import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveDispute } from '../resolveDisputeApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature resolve-disputes - resolveDisputeApi (FR-49)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolveDispute() gửi PATCH với ResolveDisputeRequest', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({
        disputeId: 'DISP-11',
        orderId: 'ORD-11',
        reason: 'DAMAGED',
        description: 'Bánh vỡ',
        status: 'RESOLVED',
        decision: 'PARTIAL_REFUND',
        refundAmount: 135000,
        decisionReason: 'Hỗ trợ bánh nứt',
        resolvedAt: '2026-10-27T09:00:00Z',
      })
    );

    const resolved = await resolveDispute('ORD-11', {
      decision: 'PARTIAL_REFUND',
      refundAmount: 135000,
      decisionReason: 'Hỗ trợ bánh nứt',
    });

    expect(patch).toHaveBeenCalledWith('/order-service/api/orders/ORD-11/dispute', {
      decision: 'PARTIAL_REFUND',
      refundAmount: 135000,
      decisionReason: 'Hỗ trợ bánh nứt',
    });
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.decision).toBe('PARTIAL_REFUND');
    expect(resolved.refundAmount).toBe(135000);
  });
});
