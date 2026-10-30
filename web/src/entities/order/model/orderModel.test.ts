import { describe, expect, it } from 'vitest';
import type { CustomOrder, ReadyOrder } from './types';
import { seedOrders } from '../api/seed';
import { complaintDaysLeft, customStatus, depositAmount, groupByPayment, readyTotal, remainingAmount } from './orderModel';

const ready = seedOrders.filter((o): o is ReadyOrder => o.kind === 'ready');
const custom = seedOrders.filter((o): o is CustomOrder => o.kind === 'custom');

describe('order model', () => {
  it('adds shipping to the goods', () => {
    expect(readyTotal(ready[0])).toBe(705000);
  });

  it('groups ready orders by payment', () => {
    const groups = groupByPayment(seedOrders);
    expect(groups.map((g) => [g.paymentId, g.orders.length, g.total])).toEqual([
      ['PAY-99214', 2, 1145000],
      ['PAY-98810', 1, 860000],
    ]);
  });

  it('splits a custom order into deposit and rest', () => {
    expect(depositAmount(custom[0])).toBe(9000000);
    expect(remainingAmount(custom[0])).toBe(9000000);
    expect(customStatus(custom[0]).label).toBe('Chờ bạn duyệt maket');
  });

  it('counts the days left to report a problem', () => {
    const delivered = ready.find((o) => o.id === 'MK-8810')!;
    expect(complaintDaysLeft(delivered, new Date(2026, 9, 20))).toBe(2);
    expect(complaintDaysLeft(ready[0])).toBeNull();
  });
});
