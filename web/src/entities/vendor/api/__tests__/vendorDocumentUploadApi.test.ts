import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadVendorDocument } from '../vendorDocumentUploadApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Vendor Entity - uploadVendorDocument (FR-26)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('xin link ở vendor-service, gửi tệp lên kho và trả về tempKey', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        tempKey: 'tmp/vendor/1.png',
        uploadUrl: 'https://minio.test/u',
        formFields: { key: 'tmp/vendor/1.png' },
      }) as never,
    );
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['abc'], 'giay-phep.png', { type: 'image/png' });

    const key = await uploadVendorDocument(file);

    expect(post).toHaveBeenCalledWith('/api/vendors/uploads', {
      contentType: 'image/png',
      sizeBytes: 3,
    });
    expect(fetchMock.mock.calls[0][0]).toBe('https://minio.test/u');
    expect(key).toBe('tmp/vendor/1.png');
  });

  it('báo lỗi khi máy chủ không trả về link', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(envelope(null) as never);

    await expect(uploadVendorDocument(new File(['a'], 'a.png'))).rejects.toThrow(
      'Máy chủ không trả về liên kết tải tệp lên.',
    );
  });
});
