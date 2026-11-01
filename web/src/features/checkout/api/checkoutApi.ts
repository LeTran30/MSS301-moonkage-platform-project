import { cartTotals, groupByShop, type CartItem } from '@/entities/cart';
import { startDemoPayment, type PaymentLink } from '@/entities/payment';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { checkoutsApi } from '@/shared/api/gateway';
import { config } from '@/shared/config/env';
import type { CheckoutAddress, CheckoutInvoice } from '../ui/CheckoutView';

type CheckoutStatusDto = 'PENDING_PAYMENT' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'REFUND_REQUESTED';

/** order-service `CheckoutResponse`: `orderIds` one per Shop once SUCCEEDED (AC-09.7). */
export interface CheckoutState {
  checkoutId: string;
  status: CheckoutStatusDto;
  totalAmount: number;
  paymentId: string;
  expiresAt: string;
  orderIds: string[];
}

interface CreateCheckoutResponseDto {
  checkoutId: string;
  paymentId: string;
  paymentUrl: string;
  totalAmount: number;
  expiresAt: string;
}

/**
 * Pays the whole cart once (FR-09, BR-29): the server holds the stock and answers the VNPay link; the orders exist
 * only after the payment succeeds. In demo mode the result page creates them from the context.
 */
export async function payCart(items: CartItem[], address: CheckoutAddress, invoice: CheckoutInvoice | null): Promise<PaymentLink> {
  if (config.demoMode) {
    const groups = groupByShop(items);
    return startDemoPayment('checkout', cartTotals(groups).total, `Mua hàng có sẵn · ${groups.length} đơn`, {
      groups: groups.map((g) => ({
        shop: g.shopName,
        shippingFee: g.shippingFee,
        lines: g.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
      })),
      address: { name: address.name, phone: address.phone, line: address.text },
      invoice,
    });
  }
  const res = await apiClient.post<ApiResponse<CreateCheckoutResponseDto>>(checkoutsApi, {
    recipientName: address.name.trim(),
    recipientPhone: address.phone.replace(/\s+/g, ''),
    provinceCode: address.provinceCode,
    addressDetail: address.detail,
    invoiceInfo: invoice && {
      name: invoice.company.trim(),
      taxCode: invoice.taxCode.trim(),
      address: invoice.address.trim(),
      email: invoice.email.trim(),
    },
  });
  const { paymentId, paymentUrl } = res.data.data;
  return { paymentId, paymentUrl };
}

/** The result page reads it for the orders the payment created. */
export async function fetchCheckout(checkoutId: string): Promise<CheckoutState> {
  const res = await apiClient.get<ApiResponse<CheckoutState>>(`${checkoutsApi}/${encodeURIComponent(checkoutId)}`);
  return res.data.data;
}
