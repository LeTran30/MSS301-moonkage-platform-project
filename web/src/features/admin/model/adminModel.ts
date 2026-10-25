import type { Tone } from '../../../shared/ui';
import type { ApplicationState, Dispute, ProvinceFee, Reconciliation, SellerApplication } from '../api/types';

export const applicationLabel: Record<ApplicationState, { label: string; tone: Tone }> = {
  pending: { label: 'Chờ duyệt', tone: 'warn' },
  'needs-more': { label: 'Cần bổ sung', tone: 'soft' },
  approved: { label: 'Đã duyệt', tone: 'ok' },
  locked: { label: 'Bị khóa', tone: 'muted' },
  rejected: { label: 'Bị từ chối', tone: 'muted' },
};

/** The automatic owner check: paper vs chip, case and accents of the name ignored. */
export function ownerMatch(a: SellerApplication) {
  const norm = (s: string) => s.normalize('NFC').toUpperCase().trim();
  return { name: norm(a.ownerOnPaper.name) === norm(a.ownerOnChip.name), id: a.ownerOnPaper.id === a.ownerOnChip.id };
}

/** Provinces still without a fee: the table cannot be saved while any is left (AC-52.3). */
export const missingFees = (fees: ProvinceFee[]) => fees.filter((f) => f.fee === null).map((f) => f.province);

/** A refund can not exceed what Moonkage still holds for the order. */
export const maxRefund = (d: Dispute) => d.held;

export const mismatches = (r: Reconciliation) => r.rows.filter((row) => row.vnpay !== row.system);
