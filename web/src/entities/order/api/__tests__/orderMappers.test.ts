import { describe, it, expect } from 'vitest';
import { mapOrderDtoToEntity, mapOrderKind, mapOrderStatus } from '../orderMappers';
import type { OrderDto } from '../orderDto';

describe('Order Entity - orderMappers (T-01)', () => {
  it('mapOrderDtoToEntity chuyển đổi DTO sang domain entity với các trường bắt buộc', () => {
    const dto: OrderDto = {
      id: 'ord-test-1',
      itemsAmount: 500000,
      shippingFee: 30000,
      totalAmount: 530000,
      status: 'PAID',
      kind: 'BUY_NOW',
      createdAt: '2026-10-25T10:00:00Z',
    };
    const entity = mapOrderDtoToEntity(dto);
    expect(entity.id).toBe('ord-test-1');
    expect(entity.subtotal).toBe(500000);
    expect(entity.shippingFee).toBe(30000);
    expect(entity.total).toBe(530000);
    expect(entity.type).toBe('RETAIL');
    expect(entity.items).toEqual([]);
  });

  it('mapOrderStatus ánh xạ đúng trạng thái backend sang trạng thái UI', () => {
    expect(mapOrderStatus('AWAITING_MOCKUP_APPROVAL')).toBe('WAITING_MAKET');
    expect(mapOrderStatus('IN_PRODUCTION')).toBe('IN_PRODUCTION');
    expect(mapOrderStatus('READY_TO_SHIP')).toBe('READY_TO_SHIP');
    expect(mapOrderStatus('DELIVERED')).toBe('DELIVERED');
    expect(mapOrderStatus(undefined)).toBe('PAID');
  });

  it('mapOrderKind ánh xạ BUY_NOW/CUSTOM_ORDER sang RETAIL/BULK', () => {
    expect(mapOrderKind('BUY_NOW')).toBe('RETAIL');
    expect(mapOrderKind('CUSTOM_ORDER')).toBe('BULK');
    expect(mapOrderKind(undefined)).toBe('RETAIL');
  });

  it('mapOrderDtoToEntity tự tính tổng khi backend không trả totalAmount', () => {
    const entity = mapOrderDtoToEntity({
      id: 'ord-test-2',
      itemsAmount: 200000,
      shippingFee: 20000,
    });
    expect(entity.total).toBe(220000);
    expect(entity.remainingPaid).toBe(true);
  });
});
