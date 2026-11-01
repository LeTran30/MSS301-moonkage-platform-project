import { startDemoPayment, type PaymentLink } from '@/entities/payment';
import { getMyVendorDetail, VENDOR_FEE, vendorDemoState } from '@/entities/vendor';
import { ApiError, apiClient, type ApiResponse } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { today } from '@/shared/utils/format';

const NO_VENDOR_MSG = 'Không tìm thấy hồ sơ người bán của tài khoản này.';

/** vendor-service `RegistrationFeePaymentLinkResponse`; `amount` is the fee in effect now (AC-53.3). */
interface FeePaymentLinkDto {
  paymentId: string;
  amount: number;
  paymentUrl: string;
}

/** AC-27.4: where to pay the vendor fee. */
export async function payVendorFee(shopName: string): Promise<PaymentLink> {
  if (config.demoMode) return startDemoPayment('vendor-fee', VENDOR_FEE, `Phí mở bán · ${shopName}`);
  const detail = await getMyVendorDetail();
  if (!detail) throw new ApiError(0, null, NO_VENDOR_MSG);
  const res = await apiClient.post<ApiResponse<FeePaymentLinkDto>>(`${vendorsApi}/${encodeURIComponent(detail.id)}/registration-fee-payments`);
  const { paymentId, paymentUrl } = res.data.data;
  return { paymentId, paymentUrl };
}

/** Demo mode, after the simulated VNPay: the shop opens. On the server the payment event opens it. */
export async function markFeePaid(): Promise<boolean> {
  if (!config.demoMode) return true;
  vendorDemoState.set({ state: 'open', approvedAt: vendorDemoState.get()?.approvedAt ?? today() });
  return mockResponse(true);
}
