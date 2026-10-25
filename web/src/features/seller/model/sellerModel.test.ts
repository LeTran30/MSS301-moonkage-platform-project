import { describe, expect, it } from 'vitest';
import { seedSellerOrders, seedTerms } from '../api/seed';
import type { SellerReadyOrder } from '../api/types';
import { inTab, sellerTodo, tierPrice } from './sellerModel';

describe('seller model', () => {
  it('suggests the tier price for a box count', () => {
    expect(tierPrice(seedTerms, 150)).toBe(120000);
    expect(tierPrice(seedTerms, 500)).toBe(110000);
    expect(tierPrice(seedTerms, 5)).toBeNull();
  });

  it('counts what the seller has to do', () => {
    const todo = sellerTodo(seedSellerOrders, 2);
    expect(todo.newOrders).toBe(1);
    expect(todo.revise).toBe(1);
    expect(todo.noInvoice).toBe(1);
    expect(todo.complaints.map((o) => o.id)).toEqual(['MK-8810']);
  });

  it('puts orders in the right tab', () => {
    const ready = seedSellerOrders.filter((o): o is SellerReadyOrder => o.kind === 'ready');
    expect(ready.filter((o) => inTab(o, 'todo')).map((o) => o.id)).toEqual(['MK-9930']);
    expect(ready.filter((o) => inTab(o, 'complaint')).map((o) => o.id)).toEqual(['MK-8810']);
  });
});
