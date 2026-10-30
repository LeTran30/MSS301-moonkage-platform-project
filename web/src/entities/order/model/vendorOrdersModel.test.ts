import { describe, expect, it } from 'vitest';
import { seedVendorOrders } from '../api/vendorOrderSeed';
import type { VendorReadyOrder } from './vendorOrderTypes';
import { inTab, vendorTodo } from './vendorOrdersModel';

describe('vendor orders model', () => {
  it('counts what the vendor has to do', () => {
    const todo = vendorTodo(seedVendorOrders, 2);
    expect(todo.newOrders).toBe(1);
    expect(todo.revise).toBe(1);
    expect(todo.noInvoice).toBe(1);
    expect(todo.complaints.map((o) => o.id)).toEqual(['MK-8810']);
  });

  it('puts orders in the right tab', () => {
    const ready = seedVendorOrders.filter((o): o is VendorReadyOrder => o.kind === 'ready');
    expect(ready.filter((o) => inTab(o, 'todo')).map((o) => o.id)).toEqual(['MK-9930']);
    expect(ready.filter((o) => inTab(o, 'complaint')).map((o) => o.id)).toEqual(['MK-8810']);
  });
});
