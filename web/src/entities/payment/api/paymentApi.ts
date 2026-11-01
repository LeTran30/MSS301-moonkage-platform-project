import { apiClient, type ApiResponse } from '@/shared/api/client';
import { paymentsPath, vnpayReturnPath } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { formatDate } from '@/shared/utils/format';

/**
 * One VNPay payment (M4.2): checkout of ready-made orders, a deposit, the rest of a custom order, or the vendor fee.
 * In the demo the VNPay page is simulated; `context` carries what the page that started it needs afterwards.
 */
export type PaymentPurpose = 'checkout' | 'deposit' | 'remaining' | 'vendor-fee';

export interface Payment {
  id: string;
  purpose: PaymentPurpose;
  amount: number;
  description: string;
  /** Free-form data the starting page reads back on the result page; from the server, `referenceId`. */
  context: Record<string, unknown>;
  status: 'pending' | 'paid' | 'cancelled';
  at: string;
}

/** Where the payer goes to pay: the VNPay page, or the simulated one (an app path) in demo mode. */
export interface PaymentLink {
  paymentId: string;
  paymentUrl: string;
}

type PaymentPurposeDto = 'CHECKOUT' | 'DEPOSIT' | 'REMAINDER' | 'REGISTRATION_FEE';
type PaymentStatusDto = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'DUPLICATE';

/** payment-service `PaymentResponse`. */
interface PaymentDto {
  paymentId: string;
  purpose: PaymentPurposeDto;
  /** checkoutId, acceptanceId, orderId or vendorId, by purpose */
  referenceId: string;
  amount: number;
  status: PaymentStatusDto;
  gatewayResponseCode: string | null;
  expiresAt: string | null;
  paidAt: string | null;
}

const purposeOf: Record<PaymentPurposeDto, PaymentPurpose> = {
  CHECKOUT: 'checkout',
  DEPOSIT: 'deposit',
  REMAINDER: 'remaining',
  REGISTRATION_FEE: 'vendor-fee',
};

/** DUPLICATE is a second success, refunded by the server (P-03): the payer did pay. */
const statusOf: Record<PaymentStatusDto, Payment['status']> = {
  PENDING: 'pending',
  SUCCEEDED: 'paid',
  FAILED: 'cancelled',
  DUPLICATE: 'paid',
};

const descriptionOf: Record<PaymentPurpose, string> = {
  checkout: 'Mua hàng có sẵn',
  deposit: 'Đặt cọc đơn đặt hàng',
  remaining: 'Phần còn lại đơn đặt hàng',
  'vendor-fee': 'Phí mở bán',
};

function fromPaymentDto(dto: PaymentDto): Payment {
  const purpose = purposeOf[dto.purpose];
  return {
    id: dto.paymentId,
    purpose,
    amount: dto.amount,
    description: descriptionOf[purpose],
    context: { referenceId: dto.referenceId },
    status: statusOf[dto.status],
    at: formatDate(dto.paidAt ?? dto.expiresAt),
  };
}

export const paymentStore = seedStore<Payment[]>('payments', []);

export async function fetchPayment(paymentId: string): Promise<Payment | null> {
  if (config.demoMode) return mockResponse(paymentStore.get().find((p) => p.id === paymentId) ?? null);
  const res = await apiClient.get<ApiResponse<PaymentDto>>(`${paymentsPath}/${encodeURIComponent(paymentId)}`);
  return fromPaymentDto(res.data.data);
}

/**
 * The query VNPay redirected the payer back with, checked by payment-service: which payment it was. It marks
 * nothing paid; the IPN does (BR-25).
 */
export async function fetchVnpayReturn(query: URLSearchParams): Promise<Payment> {
  const res = await apiClient.get<ApiResponse<PaymentDto>>(vnpayReturnPath, { params: query });
  return fromPaymentDto(res.data.data);
}
