import { describe, it, expect, vi, beforeEach } from 'vitest';
import { disputeApi, mapDisputeDtoToEntity, type DisputeDto } from '../disputeApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Dispute Entity - disputeApi (FR-12, FR-49)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mapDisputeDtoToEntity đọc đúng tên field của backend', () => {
    const dto: DisputeDto = {
      disputeId: 'DISP-1',
      orderId: 'ORD-1',
      reason: 'DAMAGED',
      description: 'Bánh vỡ',
      status: 'OPEN',
      decision: null,
      refundAmount: null,
      decisionReason: null,
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
    const entity = mapDisputeDtoToEntity(dto);
    expect(entity.id).toBe('DISP-1');
    expect(entity.orderId).toBe('ORD-1');
    expect(entity.reason).toBe('DAMAGED');
    expect(entity.status).toBe('OPEN');
    expect(entity.images).toEqual(['/a.jpg']);
    expect(entity.evidences[0].party).toBe('BUYER');
  });

  it('disputeApi.getByOrderId() bóc envelope và trả về hồ sơ', async () => {
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
});
