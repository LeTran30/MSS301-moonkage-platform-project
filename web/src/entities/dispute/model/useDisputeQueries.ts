import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { disputeApi } from '../api/disputeApi';

/**
 * The open disputes waiting for a decision (FR-49, Q5.0).
 *
 * The backend lists them through the orders that carry a dispute, so the hook
 * hides that detail from the screens.
 */
export function useOpenDisputes() {
  return useQueryData(queryKeys.dispute.open(), () => disputeApi.listOpen());
}

/** The dispute of one order (the backend allows only one open dispute per order). */
export function useDisputeByOrder(orderId: string | null) {
  return useQueryData(queryKeys.dispute.byOrder(orderId ?? ''), () =>
    orderId ? disputeApi.getByOrderId(orderId) : Promise.resolve(null),
  );
}

/**
 * Một hồ sơ khiếu nại theo mã (Q5.1).
 *
 * `GET /api/orders?disputeStatus=OPEN` là danh sách hồ sơ **đang mở**, và mỗi
 * hồ sơ trả về `disputeId`. Màn hình chi tiết nhận `disputeId` trên URL nên
 * phải tìm trong danh sách thay vì đoán.
 *
 * Trả về `null` khi không có hồ sơ nào khớp — màn hình tự hiện "không tìm
 * thấy" thay vì tự ý mở hồ sơ đầu tiên trong danh sách.
 */
export function useDisputeById(disputeId: string | null) {
  return useQueryData(queryKeys.dispute.byId(disputeId ?? ''), async () => {
    if (!disputeId) return null;
    const disputes = await disputeApi.listOpen();
    return disputes.find((d) => d.id === disputeId) ?? null;
  });
}
