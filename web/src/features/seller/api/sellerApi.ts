import { demoStore } from '../../../shared/api/demo';
import { mockResponse, seedStore } from '../../../shared/api/mock';
import {
  interProvinceFees,
  openProfile,
  pendingProfile,
  seedDisbursements,
  seedIncoming,
  seedProducts,
  seedSellerOrders,
  seedSettlements,
  seedShopNotifications,
  seedTerms,
  seedZones,
} from './seed';
import type {
  CustomTerms,
  DeliveryZones,
  Disbursement,
  IncomingRequest,
  SellerCustomOrder,
  SellerOrder,
  SellerProduct,
  SellerProfile,
  SellerReadyOrder,
  SellerState,
} from './types';

/**
 * Seller channel on seed data. The profile state of an account is kept under `seller-state:<account>`, the same
 * key the admin's approval writes (one record on a real backend).
 */
const PENDING_ACCOUNT = 'chohoso@moonkage.vn';
const account = () => demoStore.get<string>('account', '');
const stateKey = (who = account()) => `seller-state:${who}`;

const orders = seedStore('seller-orders', seedSellerOrders);
const incoming = seedStore('seller-incoming', seedIncoming);
const products = seedStore('seller-products', seedProducts);
const disbursements = seedStore('seller-disbursements', seedDisbursements);
const zones = seedStore('seller-zones', seedZones);
const terms = seedStore('seller-terms', seedTerms);

const today = () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function fetchProfile(): Promise<SellerProfile> {
  const base = account() === PENDING_ACCOUNT ? pendingProfile : openProfile;
  const stored = demoStore.get<{ state: SellerState; moreNeeded?: string; approvedAt?: string } | null>(stateKey(), null);
  return mockResponse(stored ? { ...base, ...stored } : base);
}

/** After VNPay: the seller fee is paid, the shop opens. */
export function markFeePaid() {
  demoStore.set(stateKey(), { state: 'open', approvedAt: demoStore.get<{ approvedAt?: string }>(stateKey(), {}).approvedAt ?? today() });
  return mockResponse(true);
}

/** Re-submit after "cần bổ sung". */
export function resubmitProfile() {
  demoStore.set(stateKey(), { state: 'pending' });
  return mockResponse(true);
}

export const fetchSellerOrders = () => mockResponse(orders.get());
export const fetchSellerOrder = (id: string) => mockResponse(orders.get().find((o) => o.id === id) ?? null);

function patchOrder<T extends SellerOrder>(id: string, change: (o: T) => T) {
  const next = orders.update((list) => list.map((o) => (o.id === id ? change(o as T) : o)));
  return mockResponse(next.find((o) => o.id === id) ?? null);
}

const now = () => `${today()} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

export function confirmOrder(id: string) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({ ...o, status: 'confirmed', history: [{ label: 'Bạn xác nhận đơn', at: now() }, ...o.history] }));
}

export function shipOrder(id: string, tracking?: string) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({
    ...o,
    status: 'shipping',
    tracking: tracking || o.tracking,
    history: [{ label: tracking ? `Bạn giao · ${tracking}` : 'Bạn giao cho người mua', at: now() }, ...o.history],
  }));
}

export function markDelivered(id: string) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({ ...o, status: 'delivered', deliveredAt: today(), history: [{ label: 'Đã giao', at: now() }, ...o.history] }));
}

export function attachInvoice(id: string) {
  return patchOrder(id, (o) => ({ ...o, invoiceAttached: true }));
}

export function proposeResolution(id: string, proposal: { kind: string; amount: number; note: string }) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({
    ...o,
    complaint: o.complaint && { ...o.complaint, proposal },
    history: [{ label: `Bạn đề xuất: ${proposal.kind.toLowerCase()}`, at: now() }, ...o.history],
  }));
}

export function sendMockup(id: string) {
  return patchOrder<SellerCustomOrder>(id, (o) => ({
    ...o,
    mockupsSent: o.mockupsSent + 1,
    feedback: undefined,
    progress: [...o.progress, { label: `Gửi maket lần ${o.mockupsSent + 1}`, at: today() }],
  }));
}

export function addProgress(id: string, label: string) {
  return patchOrder<SellerCustomOrder>(id, (o) => ({ ...o, progress: [...o.progress, { label, at: today() }] }));
}

export const fetchIncoming = () => mockResponse(incoming.get());
export const fetchIncomingRequest = (id: string) => mockResponse(incoming.get().find((r) => r.id === id) ?? null);

export function sendQuote(id: string, quote: NonNullable<IncomingRequest['quote']>) {
  incoming.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'quoted', quote } : r)));
  return mockResponse(true);
}

export function withdrawQuote(id: string) {
  incoming.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'new', quote: undefined } : r)));
  return mockResponse(true);
}

export function declineRequest(id: string) {
  incoming.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'declined' } : r)));
  return mockResponse(true);
}

export const fetchSellerProducts = () => mockResponse(products.get());
export const fetchSellerProduct = (id: string) => mockResponse(products.get().find((p) => p.id === id) ?? null);

export function setProductVisible(id: string, visible: boolean) {
  products.update((list) => list.map((p) => (p.id === id ? { ...p, visible } : p)));
  return mockResponse(true);
}

export function saveProduct(input: Omit<SellerProduct, 'id' | 'visible'> & { id?: string }) {
  const id = input.id ?? `sp-${Date.now()}`;
  products.update((list) =>
    input.id ? list.map((p) => (p.id === id ? { ...p, ...input, id } : p)) : [{ ...input, id, visible: true }, ...list],
  );
  return mockResponse(id);
}

export const fetchSettlements = () => mockResponse(seedSettlements);
export const fetchDisbursements = () => mockResponse(disbursements.get());

export function requestDisbursement(orderId: string, milestone: string, amount: number) {
  disbursements.update((list) => [{ orderId, milestone, amount, heldAfter: 0, state: 'Chờ quản trị duyệt' } as Disbursement, ...list]);
  return mockResponse(true);
}

export const fetchZones = () => mockResponse(zones.get());
export function saveZones(next: DeliveryZones) {
  zones.update(() => next);
  return mockResponse(true);
}
export const fetchInterProvinceFees = () => mockResponse(interProvinceFees);

export const fetchTerms = () => mockResponse(terms.get());
export function saveTerms(next: CustomTerms) {
  terms.update(() => next);
  return mockResponse(true);
}

export const fetchShopNotifications = () => mockResponse(seedShopNotifications);
