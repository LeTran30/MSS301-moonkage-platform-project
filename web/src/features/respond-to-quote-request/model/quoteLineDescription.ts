import { requestCode, type QuoteRequest } from '@/entities/request';

/**
 * The name of the one product line of a quote (FR-38).
 *
 * The line becomes the item of the custom order once the deposit is paid, so the buyer and the Shop read it on
 * the order: it names the goods and the request by its short code, never the UUID. The quantity is its own field.
 */
export function quoteLineDescription(request: QuoteRequest): string {
  return `Hộp bánh Trung Thu đặt riêng theo yêu cầu #${requestCode(request.id)}`;
}
