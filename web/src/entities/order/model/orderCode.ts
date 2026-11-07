/** How an order is named on screen: the order ID is a UUID, too long to read or say over the phone. */
const ORDER_CODE_LENGTH = 8;

/**
 * The last characters of the order ID, upper case, e.g. `DB865C6E`; the full ID stays in the URL. The end, not
 * the start: the seed IDs share their first characters and differ in the last ones.
 */
export function orderCode(orderId: string): string {
  return orderId.replaceAll('-', '').slice(-ORDER_CODE_LENGTH).toUpperCase();
}
