import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config } from '@/shared/config/env';
import { readJson, writeJson } from '@/shared/utils/storage';
import { addCartItem, fetchCartLines, removeCartItem, updateCartItem } from '../api/cartApi';
import { CartContext, type CartLine, type CartValue } from './cartModel';

/**
 * Cart of the logged-in buyer: on order-service (`/carts/me`), or in the browser in demo mode. Guests have no cart
 * (AC-02.3): the add button sends them to log in first.
 */
const STORAGE_KEY = 'moonkage.cart';
const NO_LINES: CartLine[] = [];

function useBrowserCart(): CartValue {
  const [lines, setLines] = useState<CartLine[]>(() => readJson<CartLine[]>(STORAGE_KEY, []));

  const write = useCallback((change: (current: CartLine[]) => CartLine[]) => {
    setLines((current) => {
      const next = change(current);
      writeJson(STORAGE_KEY, next);
      return next;
    });
  }, []);
  const add = useCallback(
    async (productId: string, quantity: number) =>
      write((current) =>
        current.some((l) => l.productId === productId)
          ? current.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l))
          : [...current, { productId, quantity }],
      ),
    [write],
  );
  const setQuantity = useCallback(
    (productId: string, quantity: number) => write((c) => c.map((l) => (l.productId === productId ? { ...l, quantity } : l))),
    [write],
  );
  const remove = useCallback((productId: string) => write((c) => c.filter((l) => l.productId !== productId)), [write]);
  const clear = useCallback(() => write(() => []), [write]);

  return useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), add, setQuantity, remove, clear }),
    [lines, add, setQuantity, remove, clear],
  );
}

/** `accountId` null = guest: an empty cart, nothing is called. */
function useServerCart(accountId: string | null, provinceCode: string): CartValue {
  const [fetched, setLines] = useState<CartLine[]>([]);
  // a guest sees no lines, even those of the account that just logged out
  const lines = accountId ? fetched : NO_LINES;

  const reload = useCallback(async () => {
    if (!accountId) return;
    try {
      setLines(await fetchCartLines(provinceCode));
    } catch {
      // keep what is shown; the next change reloads
    }
  }, [accountId, provinceCode]);

  useEffect(() => {
    if (!accountId) return;
    let current = true;
    fetchCartLines(provinceCode)
      .then((next) => current && setLines(next))
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [accountId, provinceCode]);

  const itemIdOf = useCallback((productId: string) => lines.find((l) => l.productId === productId)?.itemId, [lines]);
  const add = useCallback(
    async (productId: string, quantity: number) => {
      await addCartItem(productId, quantity);
      await reload();
    },
    [reload],
  );
  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const itemId = itemIdOf(productId);
      if (!itemId) return;
      setLines((c) => c.map((l) => (l.itemId === itemId ? { ...l, quantity } : l)));
      void updateCartItem(itemId, quantity).finally(reload);
    },
    [itemIdOf, reload],
  );
  const remove = useCallback(
    (productId: string) => {
      const itemId = itemIdOf(productId);
      if (!itemId) return;
      setLines((c) => c.filter((l) => l.itemId !== itemId));
      void removeCartItem(itemId).finally(reload);
    },
    [itemIdOf, reload],
  );
  const clear = useCallback(() => void reload(), [reload]);

  return useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), add, setQuantity, remove, clear }),
    [lines, add, setQuantity, remove, clear],
  );
}

function BrowserCartProvider({ children }: { children: ReactNode }) {
  return <CartContext.Provider value={useBrowserCart()}>{children}</CartContext.Provider>;
}

function ServerCartProvider({ accountId, provinceCode, children }: { accountId: string | null; provinceCode: string; children: ReactNode }) {
  return <CartContext.Provider value={useServerCart(accountId, provinceCode)}>{children}</CartContext.Provider>;
}

/** `provinceCode` decides each Shop's delivery fee on the server cart (BR-30). */
export function CartProvider({ accountId, provinceCode, children }: { accountId: string | null; provinceCode: string; children: ReactNode }) {
  return config.demoMode ? (
    <BrowserCartProvider>{children}</BrowserCartProvider>
  ) : (
    <ServerCartProvider accountId={accountId} provinceCode={provinceCode}>
      {children}
    </ServerCartProvider>
  );
}
