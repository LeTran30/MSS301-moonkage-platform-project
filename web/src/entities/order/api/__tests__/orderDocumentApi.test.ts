import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  orderDocumentApi,
  mapMockupDtoToEntity,
  mapReviewDtoToEntity,
  type MockupDto,
} from '../orderDocumentApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Order Entity - orderDocumentApi (FR-20, FR-11, FR-25)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mapMockupDtoToEntity ánh xạ đúng tên field của backend', () => {
    const dto: MockupDto = {
      versionNo: 2,
      downloadUrl: '/mockups/v2.pdf',
      reviewStatus: 'CHANGES_REQUESTED',
      reviewNote: 'To logo hơn',
      uploadedAt: '2026-10-22T08:30:00Z',
      reviewedAt: '2026-10-22T09:00:00Z',
    };
    const entity = mapMockupDtoToEntity(dto);
    expect(entity.version).toBe(2);
    expect(entity.imageUrl).toBe('/mockups/v2.pdf');
    expect(entity.status).toBe('REJECTED');
    expect(entity.comment).toBe('To logo hơn');
  });

  it('mapMockupDtoToEntity giữ PENDING_REVIEW khi backend chưa duyệt', () => {
    const entity = mapMockupDtoToEntity({
      versionNo: 1,
      downloadUrl: '/m.pdf',
      reviewStatus: 'PENDING_REVIEW',
    });
    expect(entity.status).toBe('PENDING');
  });

  it('mapReviewDtoToEntity đọc rating của backend', () => {
    const review = mapReviewDtoToEntity({
      reviewId: 'REV-1',
      productId: 'PROD-1',
      rating: 5,
      content: 'Bánh ngon',
      createdAt: '2026-10-30T10:00:00Z',
    });
    expect(review.id).toBe('REV-1');
    expect(review.rating).toBe(5);
    expect(review.content).toBe('Bánh ngon');
  });

  it('orderDocumentApi.getMockups() bóc envelope của GET /mockups', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        { versionNo: 1, downloadUrl: '/m1.pdf', reviewStatus: 'PENDING_REVIEW' },
        { versionNo: 2, downloadUrl: '/m2.pdf', reviewStatus: 'APPROVED' },
      ])
    );

    const mockups = await orderDocumentApi.getMockups('ORD-1');
    expect(mockups).toHaveLength(2);
    expect(mockups[1].status).toBe('APPROVED');
  });
});
