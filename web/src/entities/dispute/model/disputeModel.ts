import type { Dispute } from './types';

/** A refund can not exceed what Moonkage still holds for the order. */
export const maxRefund = (d: Dispute) => d.held;

export const disputeStateLabel = { open: { label: 'Đang mở', tone: 'warn' }, decided: { label: 'Đã quyết định', tone: 'ok' }, manual: { label: 'Xử lý ngoài hệ thống', tone: 'muted' } } as const;
