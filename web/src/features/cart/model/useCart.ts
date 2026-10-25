import { useContext } from 'react';
import { CartContext, type CartValue } from './cartContext';

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}
