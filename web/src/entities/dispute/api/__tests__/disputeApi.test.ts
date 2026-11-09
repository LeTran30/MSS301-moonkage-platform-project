import { describe, it, expect, vi, beforeEach } from 'vitest';
import { disputeApi, mapDisputeDtoToEntity, type DisputeDto } from '../disputeApi';
import { ApiError, apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';
import { ledgerApi } from '@/entities/payment/@x/dispute';

describe('Dispute Entity - disputeApi (FR-12, FR-49)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mapDisputeDtoToEntity đọc đúng tên field của backend', () => {
    const dto: DisputeDto = {
      disputeId: 'DISP-1',
      orderId: 'ORD-1',
      vendorName: 'Bánh Dẻo Chợ Lớn',
      recipientName: 'Phan Quốc Bảo',
      orderTotalAmount: 250000,
      reason: 'DAMAGED',
      description: 'Bánh vỡ',
      status: 'RESOLVED',
      decision: 'PARTIAL_REFUND',
      refundAmount: 75000,
      decisionReason: 'Hoàn giá 1 hộp',
      createdAt: '2026-10-26T10:15:00Z',
      evidences: [
        {
          party: 'BUYER',
          downloadUrl: '/a.jpg',
          note: 'Ảnh vỡ hộp',
          createdAt: '2026-10-26T10:16:00Z',
        },
      ],
    };
    const entity = mapDisputeDtoToEntity(dto, 175000);
    expect(entity.id).toBe('DISP-1');
    expect(entity.orderId).toBe('ORD-1');
    expect(entity.vendorName).toBe('Bánh Dẻo Chợ Lớn');
    expect(entity.buyerName).toBe('Phan Quốc Bảo');
    expect(entity.orderTotalAmount).toBe(250000);
    expect(entity.escrowHoldingAmount).toBe(175000);
    expect(entity.maxRefundableAmount).toBe(175000);
    expect(entity.refundAmount).toBe(75000);
    expect(entity.adminNote).toBe('Hoàn giá 1 hộp');
    expect(entity.evidences[0].party).toBe('BUYER');
  });

  it('không đọc được sổ tiền thì số đang giữ là 0, không đoán', () => {
    const entity = mapDisputeDtoToEntity({
      disputeId: 'D',
      orderId: 'O',
      reason: 'OTHER',
      description: 'x',
      status: 'OPEN',
    });
    expect(entity.escrowHoldingAmount).toBe(0);
  });

  it('disputeApi.getByOrderId() bóc envelope và trả về hồ sơ', async () => {
    vi.spyOn(ledgerApi, 'getLedger').mockRejectedValue(new ApiError('Forbidden', 403));
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        disputeId: 'DISP-9',
        orderId: 'ORD-9',
        reason: 'WRONG_ITEM',
        description: 'Sai mẫu',
        status: 'OPEN',
      }),
    );

    const dispute = await disputeApi.getByOrderId('ORD-9');
    expect(dispute?.id).toBe('DISP-9');
    expect(dispute?.reason).toBe('WRONG_ITEM');
  });

  it('disputeApi.getByOrderId() trả null khi đơn chưa từng bị khiếu nại (404)', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new ApiError('Không có', 404));

    await expect(disputeApi.getByOrderId('ORD-0')).resolves.toBeNull();
  });

  it('disputeApi.list() đọc hàng đợi của quản trị viên theo trạng thái', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        content: [
          {
            disputeId: 'DISP-2',
            orderId: 'ORD-2',
            reason: 'DAMAGED',
            description: 'Móp',
            status: 'RESOLVED',
          },
        ],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      }),
    );

    const disputes = await disputeApi.list('RESOLVED');
    expect(get.mock.calls[0][0]).toContain('/api/orders/disputes?status=RESOLVED');
    expect(disputes.map((d) => d.id)).toEqual(['DISP-2']);
  });
});
