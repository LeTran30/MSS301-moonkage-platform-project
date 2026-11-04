import { describe, it, expect } from 'vitest';
import { mapQuoteDto, mapQuoteRequestDto, toBackendDepositRate } from '../quoteMappers';
import type { QuoteDto, QuoteRequestDto } from '../quoteDto';

describe('Request Entity - quoteMappers (FR-15/16/17/19/38)', () => {
  it('mapQuoteRequestDto đọc đúng địa chỉ giao hàng lồng nhau của backend', () => {
    const dto: QuoteRequestDto = {
      id: 'req-1',
      type: 'DIRECT',
      buyerAccountId: 'acc-1',
      targetVendorId: 'ven-hoa',
      quantity: 150,
      budget: 160000,
      customTypes: ['BAG', 'CARD'],
      customSpec: 'In logo ép kim',
      deliveryDeadline: '2026-11-10',
      delivery: {
        recipientName: 'Chị Lan',
        recipientPhone: '0918889999',
        provinceCode: '01',
        addressDetail: '29 Liễu Giai, Ba Đình',
      },
      status: 'OPEN',
      invitedCount: 4,
      quoteCount: 2,
      createdAt: '2026-10-18T10:00:00Z',
    };

    const entity = mapQuoteRequestDto(dto);
    expect(entity.id).toBe('req-1');
    expect(entity.type).toBe('DIRECT');
    expect(entity.buyerId).toBe('acc-1');
    expect(entity.recipientName).toBe('Chị Lan');
    expect(entity.recipientPhone).toBe('0918889999');
    expect(entity.provinceCode).toBe('01');
    expect(entity.deliveryAddress).toBe('29 Liễu Giai, Ba Đình');
    expect(entity.customTypes).toEqual(['BAG', 'CARD']);
    expect(entity.invitedVendorsCount).toBe(4);
    expect(entity.quoteCount).toBe(2);
  });

  it('mapQuoteRequestDto mặc định OPEN khi backend không trả type', () => {
    const entity = mapQuoteRequestDto({ id: 'req-2' });
    expect(entity.type).toBe('OPEN');
    expect(entity.status).toBe('OPEN');
    expect(entity.quotes).toEqual([]);
  });

  it('mapQuoteDto giữ nguyên tỷ lệ cọc theo phần trăm của backend', () => {
    const dto: QuoteDto = {
      id: 'quo-1',
      vendorId: 'ven-hoa',
      vendorName: 'Cô Hoa',
      revisionNo: 2,
      items: [{ kind: 'PRODUCT', quantity: 150, unitPrice: 150000, amount: 22500000 }],
      shippingFee: 0,
      totalAmount: 22500000,
      depositRate: 40,
      depositAmount: 9000000,
      remainingAmount: 13500000,
      deliveryDate: '2026-11-08',
      deliveryMethod: 'Xe tải',
      validUntil: '2026-11-15T00:00:00Z',
      status: 'SUBMITTED',
      acceptable: true,
    };

    const quote = mapQuoteDto(dto);
    expect(quote.id).toBe('quo-1');
    expect(quote.unitPrice).toBe(150000);
    expect(quote.depositPercent).toBe(40);
    expect(quote.depositAmount).toBe(9000000);
    expect(quote.remainingAmount).toBe(13500000);
    expect(quote.status).toBe('SUBMITTED');
    expect(quote.revisionNo).toBe(2);
    expect(quote.acceptable).toBe(true);
  });

  it('toBackendDepositRate giữ tỷ lệ phần trăm và làm tròn 2 chữ số', () => {
    expect(toBackendDepositRate(40)).toBe(40);
    expect(toBackendDepositRate(33.333)).toBe(33.33);
  });
});
