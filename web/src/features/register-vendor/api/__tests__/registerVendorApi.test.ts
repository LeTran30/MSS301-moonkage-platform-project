import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerVendor } from '../registerVendorApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature register-vendor - registerVendorApi (FR-26, BR-33)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('registerVendor gửi đúng SubmitVendorRequest (BR-33: chỉ HKD hoặc DNTN)', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue(envelope({ id: 'ven-1', businessName: 'Tiệm Bánh' }) as never);

    const result = await registerVendor({
      businessName: 'Tiệm Bánh',
      entityType: 'HOUSEHOLD_BUSINESS',
      taxCode: '0109988112',
      address: 'Thôn Đắc Sở',
      provinceCode: '01',
      representativeName: 'Nguyễn Thị Hoa',
      representativeIdNumber: '079203001234',
      supplySource: 'SELF_PRODUCED',
      sellsShop: true,
      acceptsOrders: true,
      bankName: 'MB Bank',
      bankAccountNumber: '0123456789',
      bankAccountHolder: 'Nguyễn Thị Hoa',
      documents: [{ kind: 'BUSINESS_LICENSE', objectKey: 'vendors/abc/license.pdf' }],
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/api/vendors');
    expect(body).toMatchObject({
      entityType: 'HOUSEHOLD_BUSINESS',
      provinceCode: '01',
      supplySource: 'SELF_PRODUCED',
    });
    expect(body.documents).toEqual([
      { kind: 'BUSINESS_LICENSE', objectKey: 'vendors/abc/license.pdf' },
    ]);
    expect(result?.id).toBe('ven-1');
  });
});
