import { useCallback } from 'react';
import { removeCartItem } from '../api/removeCartItemApi';

/**
 * Remove a line from the cart (FR-08).
 */
export function useRemoveCartItem() {
  return useCallback((itemId: string): Promise<void> => removeCartItem(itemId), []);
}
