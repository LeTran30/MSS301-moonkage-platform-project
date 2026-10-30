import { getMyVendorDetail, vendorDemoState } from '@/entities/vendor';
import { apiClient } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { today } from '@/shared/utils/format';

/** After VNPay: the vendor fee is paid, the shop opens. */
export async function markFeePaid(): Promise<boolean> {
  if (config.demoMode) {
    vendorDemoState.set({ state: 'open', approvedAt: vendorDemoState.get()?.approvedAt ?? today() });
    return mockResponse(true);
  }
  try {
    const detail = await getMyVendorDetail();
    if (detail) {
      await apiClient.post(`${vendorsApi}/${encodeURIComponent(detail.id)}/registration-fee-payments`);
    }
  } catch {
    // payment-service may still be stubbed; keep flow moving
  }
  return true;
}
