import { complaintStore, orderStore, type Complaint } from '@/entities/order';
import { mockResponse } from '@/shared/api/mock';
import { today } from '@/shared/utils/format';

export function sendComplaint(orderId: string, shop: string, reason: string, description: string, photos: number): Promise<Complaint> {
  const complaint: Complaint = {
    id: `KN-${500 + complaintStore.get().length}`,
    orderId,
    shop,
    reason,
    description,
    photos,
    sentAt: today(),
    events: [{ label: 'Bạn gửi báo vấn đề', at: today() }],
  };
  complaintStore.update((list) => [complaint, ...list]);
  orderStore.update((list) => list.map((o) => (o.id === orderId && o.kind === 'ready' ? { ...o, complaintId: complaint.id } : o)));
  return mockResponse(complaint);
}
