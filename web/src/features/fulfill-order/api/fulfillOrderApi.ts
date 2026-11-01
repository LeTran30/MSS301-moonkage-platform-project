import { orderPath, uploadOrderFile, vendorOrderStore, type VendorCustomOrder, type VendorOrder, type VendorReadyOrder } from '@/entities/order';
import { apiClient } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { nowStamp, today } from '@/shared/utils/format';
import { formatVnd } from '@/shared/utils/money';

function patchOrder<T extends VendorOrder>(id: string, change: (o: T) => T) {
  const next = vendorOrderStore.update((list) => list.map((o) => (o.id === id ? change(o as T) : o)));
  return mockResponse(next.find((o) => o.id === id) ?? null);
}

type NextStatus = 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'IN_PRODUCTION' | 'READY_TO_SHIP';

/** FR-32, FR-40, FR-42: one step forward; the server writes the progress update with `note`. */
async function advance(id: string, status: NextStatus, extra: { trackingCode?: string; note?: string } = {}) {
  await apiClient.patch(orderPath(id), { status, ...extra });
}

export async function confirmOrder(id: string) {
  if (!config.demoMode) return advance(id, 'CONFIRMED');
  return patchOrder<VendorReadyOrder>(id, (o) => ({ ...o, status: 'confirmed', history: [{ label: 'Bạn xác nhận đơn', at: nowStamp() }, ...o.history] }));
}

/** AC-32.3: an interprovince order needs the tracking code. */
export async function shipOrder(id: string, tracking?: string) {
  if (!config.demoMode) return advance(id, 'SHIPPING', { trackingCode: tracking || undefined });
  return patchOrder<VendorReadyOrder>(id, (o) => ({
    ...o,
    status: 'shipping',
    tracking: tracking || o.tracking,
    history: [{ label: tracking ? `Bạn giao · ${tracking}` : 'Bạn giao cho người mua', at: nowStamp() }, ...o.history],
  }));
}

export async function markDelivered(id: string) {
  if (!config.demoMode) return advance(id, 'DELIVERED');
  return patchOrder<VendorReadyOrder>(id, (o) => ({ ...o, status: 'delivered', deliveredAt: today(), history: [{ label: 'Đã giao', at: nowStamp() }, ...o.history] }));
}

/** FR-44: the invoice the vendor issued. */
export async function attachInvoice(id: string, file: File) {
  if (!config.demoMode) {
    const tempKey = await uploadOrderFile(file);
    await apiClient.put(`${orderPath(id)}/invoice`, { tempKey });
    return;
  }
  return patchOrder(id, (o) => ({ ...o, invoiceAttached: true }));
}

/**
 * AC-49.1: the shop's answer to a complaint. The server keeps evidence with a note, not a structured proposal: the
 * proposal is written into the note for the admin to read.
 */
export async function proposeResolution(id: string, proposal: { kind: string; amount: number; note: string }, evidence: File) {
  if (!config.demoMode) {
    const tempKey = await uploadOrderFile(evidence);
    const offer = proposal.amount ? `${proposal.kind} ${formatVnd(proposal.amount)}` : proposal.kind;
    await apiClient.post(`${orderPath(id)}/dispute/evidences`, { tempKey, note: proposal.note.trim() ? `${offer}. ${proposal.note.trim()}` : offer });
    return;
  }
  return patchOrder<VendorReadyOrder>(id, (o) => ({
    ...o,
    complaint: o.complaint && { ...o.complaint, proposal },
    history: [{ label: `Bạn đề xuất: ${proposal.kind.toLowerCase()}`, at: nowStamp() }, ...o.history],
  }));
}

/** FR-39: a new mockup version; the first one moves the order to waiting for approval. */
export async function sendMockup(id: string, file: File) {
  if (!config.demoMode) {
    const tempKey = await uploadOrderFile(file);
    await apiClient.post(`${orderPath(id)}/mockups`, { tempKey });
    return;
  }
  return patchOrder<VendorCustomOrder>(id, (o) => ({
    ...o,
    mockupsSent: o.mockupsSent + 1,
    feedback: undefined,
    progress: [...o.progress, { label: `Gửi maket lần ${o.mockupsSent + 1}`, at: today() }],
  }));
}

const customStatusOf: Partial<Record<VendorCustomOrder['step'], NextStatus>> = {
  production: 'IN_PRODUCTION',
  delivery: 'READY_TO_SHIP',
  remaining: 'DELIVERED',
};

/** Moves a custom order to `step` with an optional note (BR-15: production waits for an approved mockup). */
export async function advanceCustomOrder(id: string, step: VendorCustomOrder['step'], label: string, note: string) {
  const status = customStatusOf[step];
  if (!config.demoMode && status) return advance(id, status, { note: note || undefined });
  return patchOrder<VendorCustomOrder>(id, (o) => ({
    ...o,
    step,
    progress: [...o.progress, { label: note ? `${label} · ${note}` : label, at: today() }],
  }));
}
