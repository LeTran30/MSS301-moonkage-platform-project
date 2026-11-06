import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createVendorProduct,
  replaceVendorProduct,
  updateVendorProductStatus,
} from '../vendorProductWriteApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature edit-product - vendorProductWriteApi (FR-29 to FR-34, FR-46)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('replaceVendorProduct() gửi kèm version để chống ghi đè (FR-32, FR-33)', async () => {
    const put = vi
      .spyOn(apiClient, 'put')
      .mockResolvedValue(envelope({ id: 'p-1', listPrice: 2000, status: 'ON_SALE' }) as never);

    await replaceVendorProduct('ven-1', 'p-1', {
      name: 'Bánh nướng',
      version: 7,
      crustCodes: ['nuong'],
      fillingCodes: ['thap-cam'],
    });

    expect(put).toHaveBeenCalledWith('/api/vendors/ven-1/products/p-1', {
      name: 'Bánh nướng',
      version: 7,
      crustCodes: ['nuong'],
      fillingCodes: ['thap-cam'],
    });
  });

  it('updateVendorProductStatus() gửi đúng payload đổi trạng thái (FR-34, FR-46)', async () => {
    const patch = vi
      .spyOn(apiClient, 'patch')
      .mockResolvedValue(envelope({ id: 'p-1', status: 'REMOVED' }) as never);

    await updateVendorProductStatus('ven-1', 'p-1', {
      status: 'REMOVED',
      removedReason: 'Vi phạm nhãn hiệu',
    });

    expect(patch).toHaveBeenCalledWith('/api/vendors/ven-1/products/p-1', {
      status: 'REMOVED',
      removedReason: 'Vi phạm nhãn hiệu',
    });
  });

  it('createVendorProduct() không nuốt lỗi API', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('HTTP 409'));
    await expect(createVendorProduct('ven-1', { name: 'Bánh nướng' })).rejects.toThrow('HTTP 409');
  });
});
