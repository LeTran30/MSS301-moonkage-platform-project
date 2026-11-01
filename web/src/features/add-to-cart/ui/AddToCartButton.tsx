import { useEffect, useState } from 'react';
import { useCart } from '@/entities/cart';
import { ApiError } from '@/shared/api/client';
import { addToCartStrings } from '../strings';
import styles from './AddToCartButton.module.css';

/**
 * Adds `quantity` boxes. A guest has no cart: `onNeedLogin` runs instead (login, then back, AC-02.3).
 * On a card it is the DS outline button; on the product page the primary one (DS v2: buying is `primary`, not red).
 * The label names the product, since a grid has many buttons with the same text.
 */
const CONFIRM_MS = 2000;

export function AddToCartButton({
  productId,
  productName,
  quantity = 1,
  loggedIn,
  onNeedLogin,
  size = 'md',
}: {
  productId: string;
  productName: string;
  quantity?: number;
  loggedIn: boolean;
  onNeedLogin: () => void;
  size?: 'sm' | 'md';
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [added]);

  const onClick = async () => {
    if (!loggedIn) return onNeedLogin();
    setBusy(true);
    setError(null);
    try {
      await add(productId, quantity);
      setAdded(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : addToCartStrings.failed);
    } finally {
      setBusy(false);
    }
  };

  const cls = size === 'sm' ? 'mk-btn mk-btn--outline mk-btn--sm' : `mk-btn mk-btn--primary ${styles.buttonBlock} buy-box__add`;
  return (
    <>
      <button
        type="button"
        className={cls}
        onClick={onClick}
        disabled={busy}
        aria-busy={busy || undefined}
        aria-label={size === 'sm' ? addToCartStrings.addNamed(productName) : undefined}
      >
        {added ? addToCartStrings.added : addToCartStrings.add}
      </button>
      <span className="mk-sr" role="status">
        {added ? addToCartStrings.addedAnnounce(quantity) : ''}
      </span>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
