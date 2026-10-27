import { mockResponse, seedStore } from '@/shared/api/mock';
import { seedVendorOrders } from './vendorOrderSeed';

/** The shop's orders, kept in the demo store: no vendor order endpoint is called yet. */
export const vendorOrderStore = seedStore('vendor-orders', seedVendorOrders);

export const fetchVendorOrders = () => mockResponse(vendorOrderStore.get());
export const fetchVendorOrder = (id: string) => mockResponse(vendorOrderStore.get().find((o) => o.id === id) ?? null);
