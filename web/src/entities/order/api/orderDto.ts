import type { Order } from '../model/types';

/**
 * Wire shapes of the order-service contracts.
 *
 * Split out of the API module so the DTO catalogue stays readable and the API
 * module stays focused on the requests.
 */

/**
 * Wire shape of `com.moonkage.order.dto.response.OrderResponse`.
 *
 * The backend names the money fields `itemsAmount` / `totalAmount` and the buyer
 * `buyerAccountId`; the UI used `subtotal` / `total` / `buyerId`.
 */
export interface OrderDto {
  id: string;
  kind?: 'BUY_NOW' | 'CUSTOM_ORDER';
  status?: string;
  buyerAccountId?: string;
  vendorId?: string;
  vendorName?: string;
  paymentGroupId?: string;
  quoteId?: string;
  itemsAmount?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount?: number;
  depositAmount?: number | null;
  remainingAmount?: number | null;
  interprovince?: boolean;
  hasCustom?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  provinceCode?: string;
  addressDetail?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  trackingCode?: string;
  invoiceInfo?: { name: string; taxCode: string; address: string; email: string };
  hasInvoiceFile?: boolean;
  deliveredAt?: string;
  receivedConfirmedAt?: string;
  complaintDeadline?: string;
  createdAt?: string;
  items?: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
}

/**
 * Backend `OrderStatus` is `PAID | CONFIRMED | SHIPPING | DEPOSITED |
 * AWAITING_MOCKUP_APPROVAL | IN_PRODUCTION | READY_TO_SHIP | DELIVERED | COMPLETED`.
 */
export type BackendOrderStatus =
  | 'PAID'
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'DEPOSITED'
  | 'AWAITING_MOCKUP_APPROVAL'
  | 'IN_PRODUCTION'
  | 'READY_TO_SHIP'
  | 'DELIVERED'
  | 'COMPLETED';

/** The UI order status set (retail + bulk). */
export type UiOrderStatus = Order['status'];

/**
 * Wire shape of `com.moonkage.order.dto.response.CreateCheckoutResponse`.
 */
export interface CheckoutResponse {
  checkoutId: string;
  paymentId: string;
  paymentUrl: string;
  totalAmount: number;
  expiresAt: string;
}

/**
 * Wire shape of `com.moonkage.order.dto.response.CheckoutResponse`.
 *
 * `orderIds` holds one id per Shop, filled once the checkout succeeded
 * (AC-09.7); it is empty while the payment is still pending.
 */
export interface CheckoutDto {
  checkoutId: string;
  status: 'PENDING_PAYMENT' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'REFUND_REQUESTED';
  totalAmount: number;
  paymentId: string;
  expiresAt?: string | null;
  orderIds?: string[];
}

/**
 * Wire shape of `com.moonkage.order.dto.request.CreateCheckoutRequest`.
 *
 * `provinceCode` decides the delivery fee of each Shop (BR-30); `invoiceInfo`
 * is copied into every order of the checkout (BR-29).
 */
export interface CreateCheckoutPayload {
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  addressDetail: string;
  invoiceInfo?: {
    name: string;
    taxCode: string;
    address: string;
    email: string;
  };
}

/**
 * Wire shape of `com.moonkage.order.dto.response.ProgressUpdateResponse`.
 *
 * One step of the order's history: the status it reached, the vendor's note and
 * the photos of the step (FR-21, FR-40).
 */
export interface ProgressUpdateDto {
  milestone: string;
  note?: string | null;
  photoKeys?: string[];
  createdAt?: string;
}

/** One step of the order's history. */
export type ProgressUpdate = {
  milestone: string;
  note?: string;
  photoKeys: string[];
  createdAt: string;
};

/** Wire shape of `com.moonkage.order.dto.response.PaymentLinkResponse`. */
export interface PaymentLinkResponse {
  paymentId: string;
  paymentUrl: string;
}
