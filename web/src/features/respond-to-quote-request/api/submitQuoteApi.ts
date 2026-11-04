import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { generateEntityId } from '@/shared/utils';
import type { CustomType, Quote } from '@/entities/request';
import { mapQuoteDto, type QuoteDto } from '@/entities/request';

/**
 * The write side of the vendor's quote (FR-38).
 *
 * The request entity owns the read and the shape of the quote; the write lives
 * here because it submits the quote, not the quote data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Wire shape of `com.moonkage.quotation.dto.request.QuoteItemRequest`. */
export interface QuoteItemPayload {
  description: string;
  productRef?: string;
  quantity: number;
  unitPrice: number;
}

/** Wire shape of `com.moonkage.quotation.dto.request.CustomItemRequest`. */
export interface CustomItemPayload {
  customType: CustomType;
  description: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.request.SubmitQuoteRequest`.
 *
 * The server computes every total, the deposit and the remainder: the client
 * sends the lines and the shipping fee only (FR-38).
 * `depositRate` is a percent in (0, 100]; `validDays` is 1..14 (Q-19).
 */
export interface SubmitQuotePayload {
  items: QuoteItemPayload[];
  customItems?: CustomItemPayload[];
  shippingFee: number;
  depositRate: number;
  deliveryDate: string;
  deliveryMethod: string;
  validDays: number;
  notes?: string;
  supersedesQuoteId?: string;
}

/** The vendor submits a quote for a request (FR-38). */
export async function submitQuote(
  requestId: string,
  payload: SubmitQuotePayload
): Promise<Quote> {
  if (isDemoMode()) {
    const itemsAmount = payload.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const customSurcharge = (payload.customItems ?? []).reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );
    const total = itemsAmount + customSurcharge + payload.shippingFee;
    const deposit = Math.floor((total * payload.depositRate) / 100);
    return {
      id: generateEntityId('QUO'),
      vendorId: '',
      vendorName: '',
      vendorRating: 0,
      unitPrice: payload.items[0]?.unitPrice ?? 0,
      shippingFee: payload.shippingFee,
      totalPrice: total,
      depositPercent: payload.depositRate,
      depositAmount: deposit,
      remainingAmount: total - deposit,
      estimatedDeliveryDate: payload.deliveryDate,
      deliveryMethod: payload.deliveryMethod,
      validUntil: '',
      note: payload.notes,
      status: 'SUBMITTED',
      acceptable: true,
    };
  }
  const res = await apiClient.post<unknown>(GATEWAY.QUOTATION.SUBMIT_QUOTE(requestId), payload);
  const dto = unwrap<QuoteDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về báo giá.');
  }
  return mapQuoteDto(dto);
}
