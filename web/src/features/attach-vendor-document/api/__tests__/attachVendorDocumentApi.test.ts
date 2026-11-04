import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachVendorDocument } from '../attachVendorDocumentApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature attach-vendor-document - attachVendorDocumentApi (Q-36, AC-27.6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('gửi POST với kind FEE_INVOICE đúng endpoint tài liệu của gian hàng', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({ id: 'doc-1', kind: 'FEE_INVOICE' }) as never,
    );

    const document = await attachVendorDocument('ven-1', {
      kind: 'FEE_INVOICE',
      objectKey: 'temp/fee-invoice.pdf',
    });

    expect(post).toHaveBeenCalledWith('/api/vendors/ven-1/documents', {
      kind: 'FEE_INVOICE',
      objectKey: 'temp/fee-invoice.pdf',
    });
    expect(document?.kind).toBe('FEE_INVOICE');
  });
});
