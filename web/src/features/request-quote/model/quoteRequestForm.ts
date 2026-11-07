import { validators } from '@/shared/lib';
import { SPEC_PART_SEPARATOR } from '@/entities/request';

/** The least an open request asks for, so the Shops quote a wholesale price. */
export const OPEN_REQUEST_MIN_QUANTITY = 20;

/** The fields of the quote request form that can show an error. */
export type QuoteFormField =
  | 'quantity'
  | 'deliveryDeadline'
  | 'recipientName'
  | 'recipientPhone'
  | 'deliveryAddress';

export type QuoteFormErrors = Partial<Record<QuoteFormField, string>>;

export interface QuoteFormValues {
  quantity: string;
  deliveryDeadline: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
}

/**
 * Checks the quote request form before it reaches the API (FR-15, FR-16), so a request without a quantity or an
 * address never becomes a request on the server, and the error shows next to its field.
 *
 * @param minQuantity the least the request may ask for: the platform's for an open request, the Shop's own for a
 *     direct one (AC-15.2)
 * @param belowMinMessage what the quantity field says under that minimum
 */
export function validateQuoteForm(
  values: QuoteFormValues,
  minQuantity: number,
  belowMinMessage: string,
): QuoteFormErrors {
  const errors: QuoteFormErrors = {};

  const quantity = parseInt(values.quantity, 10);
  if (!values.quantity.trim() || Number.isNaN(quantity)) {
    errors.quantity = 'Số lượng hộp cần đặt không được để trống';
  } else if (quantity < minQuantity) {
    errors.quantity = belowMinMessage;
  }

  if (!values.deliveryDeadline.trim()) {
    errors.deliveryDeadline = 'Hạn giao hàng mong muốn không được để trống';
  }

  if (!values.recipientName.trim()) {
    errors.recipientName = 'Người nhận không được để trống';
  }

  const phoneError = validators.phoneVN(values.recipientPhone);
  if (phoneError) {
    errors.recipientPhone = phoneError;
  }

  if (!values.deliveryAddress.trim()) {
    errors.deliveryAddress = 'Địa chỉ nhận hàng chi tiết không được để trống';
  }

  return errors;
}

/** The `customSpec` of the request: the buyer's notes, then the crust and the filling they prefer. */
export function joinCustomSpec(requirements: string, crust: string, filling: string): string {
  return [requirements, crust && `Vỏ: ${crust}`, filling && `Nhân: ${filling}`]
    .filter(Boolean)
    .join(SPEC_PART_SEPARATOR);
}
