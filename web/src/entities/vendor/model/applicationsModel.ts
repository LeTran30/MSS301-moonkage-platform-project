import type { Tone } from '@/shared/ui';
import type { ApplicationState, VendorApplication } from './applicationTypes';

export const applicationLabel: Record<ApplicationState, { label: string; tone: Tone }> = {
  pending: { label: 'Chờ duyệt', tone: 'warn' },
  'needs-more': { label: 'Cần bổ sung', tone: 'soft' },
  approved: { label: 'Đã duyệt', tone: 'ok' },
  locked: { label: 'Bị khóa', tone: 'muted' },
  rejected: { label: 'Bị từ chối', tone: 'muted' },
};

/** The automatic owner check: paper vs chip, case and accents of the name ignored. */
export function ownerMatch(a: VendorApplication) {
  const norm = (s: string) => s.normalize('NFC').toUpperCase().trim();
  return { name: norm(a.ownerOnPaper.name) === norm(a.ownerOnChip.name), id: a.ownerOnPaper.id === a.ownerOnChip.id };
}
