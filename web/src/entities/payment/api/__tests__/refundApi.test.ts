import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refundApi } from '../refundApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

const REFUND_DTO = {
  refundId: 'ref-1',
  orderId: 'MK-1',
  disputeId: 'dsp-1',
  paymentId: 'pay-1',
  reason: 'DISPUTE',
  amount: 500000,
  status: 'MANUAL_REQUIRED',
  error: 'Gateway refused',
  createdAt: '2026-11-01T00:00:00Z',
};

describe('Payment Entity - refundApi (AC-49.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('list mặc định lấy các hoàn tiền cần xử lý tay', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        content: [REFUND_DTO],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      }) as never,
    );

    const refunds = await refundApi.list();

    expect(get.mock.calls[0][0]).toContain('/payment-service/api/refunds?');
    expect(get.mock.calls[0][0]).toContain('status=MANUAL_REQUIRED');
    expect(refunds[0].refundId).toBe('ref-1');
    expect(refunds[0].status).toBe('MANUAL_REQUIRED');
  });

  it('getById đọc một khoản hoàn tiền', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(REFUND_DTO) as never);

    const refund = await refundApi.getById('ref-1');

    expect(get).toHaveBeenCalledWith('/payment-service/api/refunds/ref-1');
    expect(refund?.amount).toBe(500000);
  });
});
