import { complaintStore, orderPath, orderStore, uploadOrderFile, type Complaint } from '@/entities/order';
import { apiClient } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { disputeReasonLabel, type DisputeReasonCode } from '@/shared/config/disputes';
import { config } from '@/shared/config/env';
import { today } from '@/shared/utils/format';

/** FR-12: while the complaint window is open; each photo is uploaded first, then sent as evidence. */
export async function sendComplaint(orderId: string, shop: string, reason: DisputeReasonCode, description: string, photos: File[]): Promise<void> {
  if (!config.demoMode) {
    const tempKeys = await Promise.all(photos.map(uploadOrderFile));
    await apiClient.post(`${orderPath(orderId)}/dispute`, { reason, description, evidences: tempKeys.map((tempKey) => ({ tempKey })) });
    return;
  }
  const complaint: Complaint = {
    id: `KN-${500 + complaintStore.get().length}`,
    orderId,
    shop,
    reason: disputeReasonLabel(reason),
    description,
    photos: photos.length,
    sentAt: today(),
    events: [{ label: 'Bạn gửi báo vấn đề', at: today() }],
  };
  complaintStore.update((list) => [complaint, ...list]);
  orderStore.update((list) => list.map((o) => (o.id === orderId && o.kind === 'ready' ? { ...o, complaintId: complaint.id } : o)));
  await mockResponse(complaint);
}
