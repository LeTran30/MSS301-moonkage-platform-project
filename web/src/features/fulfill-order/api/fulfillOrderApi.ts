import { vendorOrderStore, type VendorCustomOrder, type VendorOrder, type VendorReadyOrder } from '@/entities/order';
import { mockResponse } from '@/shared/api/mock';
import { nowStamp, today } from '@/shared/utils/format';

function patchOrder<T extends VendorOrder>(id: string, change: (o: T) => T) {
  const next = vendorOrderStore.update((list) => list.map((o) => (o.id === id ? change(o as T) : o)));
  return mockResponse(next.find((o) => o.id === id) ?? null);
}

export function confirmOrder(id: string) {
  return patchOrder<VendorReadyOrder>(id, (o) => ({ ...o, status: 'confirmed', history: [{ label: 'Bạn xác nhận đơn', at: nowStamp() }, ...o.history] }));
}

export function shipOrder(id: string, tracking?: string) {
  return patchOrder<VendorReadyOrder>(id, (o) => ({
    ...o,
    status: 'shipping',
    tracking: tracking || o.tracking,
    history: [{ label: tracking ? `Bạn giao · ${tracking}` : 'Bạn giao cho người mua', at: nowStamp() }, ...o.history],
  }));
}

export function markDelivered(id: string) {
  return patchOrder<VendorReadyOrder>(id, (o) => ({ ...o, status: 'delivered', deliveredAt: today(), history: [{ label: 'Đã giao', at: nowStamp() }, ...o.history] }));
}

export function attachInvoice(id: string) {
  return patchOrder(id, (o) => ({ ...o, invoiceAttached: true }));
}

export function proposeResolution(id: string, proposal: { kind: string; amount: number; note: string }) {
  return patchOrder<VendorReadyOrder>(id, (o) => ({
    ...o,
    complaint: o.complaint && { ...o.complaint, proposal },
    history: [{ label: `Bạn đề xuất: ${proposal.kind.toLowerCase()}`, at: nowStamp() }, ...o.history],
  }));
}

export function sendMockup(id: string) {
  return patchOrder<VendorCustomOrder>(id, (o) => ({
    ...o,
    mockupsSent: o.mockupsSent + 1,
    feedback: undefined,
    progress: [...o.progress, { label: `Gửi maket lần ${o.mockupsSent + 1}`, at: today() }],
  }));
}

export function addProgress(id: string, label: string) {
  return patchOrder<VendorCustomOrder>(id, (o) => ({ ...o, progress: [...o.progress, { label, at: today() }] }));
}
