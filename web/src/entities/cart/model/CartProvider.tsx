import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { readJson, writeJson } from '@/shared/utils/storage';
import { CartContext, type CartLine } from './cartModel';

/**
 * Cart of the logged-in buyer, kept in the browser until the cart endpoint exists. Guests have no cart (AC-02.3):
 * the add button sends them to log in first.
 */
const STORAGE_KEY = 'moonkage.cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readJson<CartLine[]>(STORAGE_KEY, []));

  const add = useCallback((productId: string, quantity: number) => {
    setLines((current) => {
      const existing = current.find((l) => l.productId === productId);
      const next = existing
        ? current.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l))
        : [...current, { productId, quantity }];
      writeJson(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const write = useCallback((change: (current: CartLine[]) => CartLine[]) => {
    setLines((current) => {
      const next = change(current);
      writeJson(STORAGE_KEY, next);
      return next;
    });
  }, []);
  const setQuantity = useCallback(
    (productId: string, quantity: number) => write((c) => c.map((l) => (l.productId === productId ? { ...l, quantity } : l))),
    [write],
  );
  const remove = useCallback((productId: string) => write((c) => c.filter((l) => l.productId !== productId)), [write]);
  const clear = useCallback(() => write(() => []), [write]);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), add, setQuantity, remove, clear }),
    [lines, add, setQuantity, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
