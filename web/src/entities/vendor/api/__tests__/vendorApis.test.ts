import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cakeAttributeApi } from '../cakeAttributeApi';
import { registrationFeeApi } from '../registrationFeeApi';
import { vendorAdminApi } from '../vendorAdminApi';
import { vendorCatalogApi } from '../vendorCatalogApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Vendor Entity - vendorCatalogApi (FR-14, FR-27, FR-35)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getVendors gửi provinceCode của tỉnh hiện tại', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        {
          vendorId: 'ven-1',
          businessName: 'Tiệm Bánh',
          ordersOnly: true,
          deliveryAreas: ['Hà Nội'],
          minQty: 20,
          leadTimeDays: 3,
        },
      ]) as never,
    );

    const vendors = await vendorCatalogApi.getVendors('Hà Nội');

    expect(get).toHaveBeenCalledWith('/quotation-service/api/suppliers?provinceCode=01');
    expect(vendors[0].name).toBe('Tiệm Bánh');
    expect(vendors[0].bulkMinQuantity).toBe(20);
  });

  it('getMyVendorId lấy id của shop người đăng nhập', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue(envelope([{ id: 'ven-9', businessName: 'Shop của tôi' }]) as never);

    const id = await vendorCatalogApi.getMyVendorId();

    expect(get).toHaveBeenCalledWith('/api/vendors?ownerAccountId=me');
    expect(id).toBe('ven-9');
  });
});

describe('Vendor Entity - vendorAdminApi (FR-45, FR-46)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('searchVendors lọc theo status của VendorStatus', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        {
          id: 'ven-1',
          ownerAccountId: 'acc-1',
          businessName: 'Tiệm Bánh',
          status: 'PENDING',
          supplySource: 'SELF_PRODUCED',
          sellsShop: true,
          acceptsOrders: true,
        },
      ]) as never,
    );

    const vendors = await vendorAdminApi.searchVendors({ status: 'PENDING' });

    expect(get).toHaveBeenCalledWith('/api/vendors?status=PENDING');
    expect(vendors).toHaveLength(1);
    expect(vendors[0].status).toBe('PENDING');
  });

  it('getOwnerChecks đọc kết quả đối chiếu chủ hộ (AC-45.4)', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        {
          submissionNo: 1,
          ownerLegalName: 'Nguyễn A',
          idMatch: true,
          nameMatch: 'EXACT',
        },
      ]) as never,
    );

    const checks = await vendorAdminApi.getOwnerChecks('ven-1');

    expect(get).toHaveBeenCalledWith('/api/vendors/ven-1/owner-checks');
    expect(checks[0].nameMatch).toBe('EXACT');
  });
});

describe('Vendor Entity - cakeAttributeApi (FR-54)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('list lọc theo group và bỏ hidden khi không xin admin', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        {
          id: 'a1',
          group: 'CRUST',
          code: '01',
          label: 'Hỷ',
          sortOrder: 1,
          active: true,
        },
      ]) as never,
    );

    const items = await cakeAttributeApi.list('CRUST');

    expect(get).toHaveBeenCalledWith('/api/cake-attributes?group=CRUST');
    expect(items[0].label).toBe('Hỷ');
  });

  it('labelsOf gửi nhiều codes để lấy nhãn kể cả giá trị ẩn (AC-54.4)', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope([]) as never);

    await cakeAttributeApi.labelsOf(['01', '02']);

    expect(get.mock.calls[0][0]).toBe('/api/cake-attributes?codes=01&codes=02');
  });
});

describe('Vendor Entity - registrationFeeApi (FR-53, AC-26.9)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getConfig đọc mức phí đang có hiệu lực', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        amount: 200000,
        effectiveFrom: '2026-11-01T00:00:00Z',
      }) as never,
    );

    const config = await registrationFeeApi.getConfig();

    expect(get).toHaveBeenCalledWith('/api/registration-fee-config');
    expect(config?.amount).toBe(200000);
  });

  it('registrationFeeApi được export từ cùng entity', () => {
    expect(registrationFeeApi.getConfig).toBeTypeOf('function');
  });
});
