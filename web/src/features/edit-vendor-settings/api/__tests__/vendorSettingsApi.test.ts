import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resubmitVendorProfile,
  saveDeliveryAreas,
  saveOrderProfile,
  updateVendor,
  createVendorUploadLink,
} from '../vendorSettingsApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature edit-vendor-settings - vendorSettingsApi (FR-26/28/35)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('saveOrderProfile gửi priceTiers và leadTimeDays (FR-35)', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue(envelope({}) as never);

    await saveOrderProfile('ven-1', {
      leadTimeDays: 7,
      priceTiers: [{ fromQty: 50, unitPrice: 160000 }],
      minQty: 50,
    });

    const [url, body] = put.mock.calls[0];
    expect(url).toBe('/api/vendors/ven-1/order-profile');
    expect(body).toEqual({
      leadTimeDays: 7,
      priceTiers: [{ fromQty: 50, unitPrice: 160000 }],
      minQty: 50,
    });
  });

  it('saveDeliveryAreas gửi provinceCodes dạng mã 2 chữ số (FR-28)', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue(envelope(['01', '79']) as never);

    await saveDeliveryAreas('ven-1', ['01', '79']);

    expect(put.mock.calls[0][0]).toBe('/api/vendors/ven-1/delivery-areas');
    expect(put.mock.calls[0][1]).toEqual({ provinceCodes: ['01', '79'] });
  });

  it('updateVendor chỉ gửi localDeliveryFee của chủ shop (FR-28)', async () => {
    const patch = vi
      .spyOn(apiClient, 'patch')
      .mockResolvedValue(envelope({ id: 'ven-1', localDeliveryFee: 20000 }) as never);

    await updateVendor('ven-1', { localDeliveryFee: 20000 });

    expect(patch.mock.calls[0][0]).toBe('/api/vendors/ven-1');
    expect(patch.mock.calls[0][1]).toEqual({ localDeliveryFee: 20000 });
  });

  it('resubmitVendorProfile gửi cả hồ sơ lần hai (AC-27.2)', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue(envelope({ id: 'ven-1' }) as never);

    await resubmitVendorProfile('ven-1', {
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

    expect(put.mock.calls[0][0]).toBe('/api/vendors/ven-1');
  });

  it('createVendorUploadLink gửi contentType và sizeBytes (FR-26)', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        tempKey: 'tmp/1',
        uploadUrl: 'https://minio.test/u',
        expiresAt: '2026-11-02T04:00:00Z',
      }) as never,
    );

    const link = await createVendorUploadLink('application/pdf', 1024);

    expect(post.mock.calls[0][0]).toBe('/api/vendors/uploads');
    expect(post.mock.calls[0][1]).toEqual({
      contentType: 'application/pdf',
      sizeBytes: 1024,
    });
    expect(link?.tempKey).toBe('tmp/1');
  });
});
