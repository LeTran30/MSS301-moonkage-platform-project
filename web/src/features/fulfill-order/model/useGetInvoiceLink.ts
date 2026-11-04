import { useCallback } from 'react';
import { orderDocumentApi } from '@/entities/order';

/**
 * FR-25: the link to the vendor's invoice of an order.
 */
export function useGetInvoiceLink() {
  return useCallback((orderId: string) => orderDocumentApi.getInvoice(orderId), []);
}
