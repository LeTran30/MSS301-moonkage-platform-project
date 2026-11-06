import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile } from '../uploadFile';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature file-upload - uploadFile (FR-26, FR-29)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('xin link ở kho đơn hàng rồi gửi bytes, trả về tempKey', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        tempKey: 'temp/evidence-1.jpg',
        uploadUrl: 'https://minio.local/upload',
        formFields: { key: 'abc' },
      }) as never,
    );
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));

    const file = new File(['bytes'], 'evidence.jpg', { type: 'image/jpeg' });
    const tempKey = await uploadFile('ORDER', file);

    expect(post).toHaveBeenCalledWith('/api/orders/uploads', {
      contentType: 'image/jpeg',
      sizeBytes: file.size,
    });
    expect(tempKey).toBe('temp/evidence-1.jpg');

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('POST');
    const body = init?.body as FormData;
    expect(body.get('key')).toBe('abc');
    expect(body.get('file')).toBeInstanceOf(File);
  });

  it('xin link ở kho hồ sơ gian hàng khi target là VENDOR', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        tempKey: 'temp/doc-1.pdf',
        uploadUrl: 'https://minio.local/upload',
      }) as never,
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const file = new File(['bytes'], 'doc.pdf', { type: 'application/pdf' });
    await uploadFile('VENDOR', file);

    expect(post).toHaveBeenCalledWith('/api/vendors/uploads', {
      contentType: 'application/pdf',
      sizeBytes: file.size,
    });
  });

  it('báo lỗi khi máy chủ không trả về link tải lên', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(envelope(null) as never);

    const file = new File(['bytes'], 'doc.pdf', { type: 'application/pdf' });
    await expect(uploadFile('ORDER', file)).rejects.toThrow(
      'Máy chủ không trả về liên kết tải tệp lên.',
    );
  });

  it('báo lỗi khi kho lưu trữ từ chối tệp', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        tempKey: 'temp/doc-1.pdf',
        uploadUrl: 'https://minio.local/upload',
      }) as never,
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const file = new File(['bytes'], 'doc.pdf', { type: 'application/pdf' });
    await expect(uploadFile('ORDER', file)).rejects.toThrow(
      'Không tải được tệp lên kho lưu trữ.',
    );
  });

  it('báo giai đoạn để giao diện vẽ tiến độ', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        tempKey: 'temp/doc-1.pdf',
        uploadUrl: 'https://minio.local/upload',
      }) as never,
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const phases: string[] = [];
    const file = new File(['bytes'], 'doc.pdf', { type: 'application/pdf' });
    await uploadFile('ORDER', file, { onPhase: (phase) => phases.push(phase) });

    expect(phases).toEqual(['linking', 'uploading', 'done']);
  });
});
