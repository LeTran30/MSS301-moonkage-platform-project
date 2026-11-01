import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaymentLink } from '@/entities/payment';

/** Sends the payer to pay: VNPay is another site; the demo's simulated page is a path of this app. */
export function useOpenPayment() {
  const navigate = useNavigate();
  return useCallback(
    (link: PaymentLink) => {
      if (link.paymentUrl.startsWith('/')) navigate(link.paymentUrl);
      else window.location.assign(link.paymentUrl);
    },
    [navigate],
  );
}
