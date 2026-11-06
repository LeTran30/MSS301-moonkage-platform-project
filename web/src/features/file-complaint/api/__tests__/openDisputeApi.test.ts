import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDispute, addDisputeEvidence } from '../openDisputeApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature file-complaint - openDisputeApi (FR-12, AC-49.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('openDispute() gửi đúng payload OpenDisputeRequest', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        disputeId: 'DISP-10',
        orderId: 'ORD-10',
        reason: 'DAMAGED',
        description: 'Bánh vỡ',
        status: 'OPEN',
      }),
    );

    await openDispute('ORD-10', {
      reason: 'DAMAGED',
      description: 'Bánh vỡ',
      evidences: [{ tempKey: 'tmp/1' }],
    });

    expect(post).toHaveBeenCalledWith('/api/orders/ORD-10/dispute', {
      reason: 'DAMAGED',
      description: 'Bánh vỡ',
      evidences: [{ tempKey: 'tmp/1' }],
    });
  });

  it('addDisputeEvidence() dùng đúng endpoint evidences', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        disputeId: 'DISP-12',
        orderId: 'ORD-12',
        reason: 'DAMAGED',
        description: 'Bánh vỡ',
        status: 'OPEN',
      }),
    );

    await addDisputeEvidence('ORD-12', { tempKey: 'tmp/2', note: 'Ảnh mới' });
    expect(post).toHaveBeenCalledWith('/api/orders/ORD-12/dispute/evidences', {
      tempKey: 'tmp/2',
      note: 'Ảnh mới',
    });
  });
});
