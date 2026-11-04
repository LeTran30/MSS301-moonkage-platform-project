import { routes } from '@/shared/config';

/**
 * Send the payer to the page the server answered (M4.2, FR-09, BR-25).
 *
 * With a backend this is the VNPay page; VNPay brings the payer back to the
 * result page (M4.3) through `VNPAY_RETURN_URL`. A full navigation, not a
 * router push, because the gateway is another site.
 */
export function openPaymentPage(paymentUrl: string): void {
  window.location.assign(paymentUrl);
}

/** Demo mode has no gateway: the "payment page" is the result page itself. */
export function demoPaymentUrl(paymentId: string): string {
  return `${routes.base.paymentResult}?${new URLSearchParams({ paymentId }).toString()}`;
}
