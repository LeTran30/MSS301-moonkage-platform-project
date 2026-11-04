import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductUploadLink } from '../productUploadApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature upload-product-image - productUploadApi (FR-29, AC-29.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('gửi POST contentType và sizeBytes đúng endpoint upload ảnh sản phẩm', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        tempKey: 'temp/product-1.jpg',
        uploadUrl: 'https://minio.local/upload',
        expiresAt: '2026-11-02T04:00:00Z',
      }) as never,
    );

    const link = await createProductUploadLink('ven-1', 'image/jpeg', 2048);

    expect(post).toHaveBeenCalledWith('/api/vendors/ven-1/products/uploads', {
      contentType: 'image/jpeg',
      sizeBytes: 2048,
    });
    expect(link?.tempKey).toBe('temp/product-1.jpg');
  });
});
