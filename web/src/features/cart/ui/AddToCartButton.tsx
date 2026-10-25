import { useEffect, useState } from 'react';
import { useCart } from '../model/useCart';
import { cartStrings } from '../strings';

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

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [added]);

  const onClick = () => {
    if (!loggedIn) return onNeedLogin();
    add(productId, quantity);
    setAdded(true);
  };

  const cls = size === 'sm' ? 'mk-btn mk-btn--outline mk-btn--sm' : 'mk-btn mk-btn--primary buy-box__add';
  return (
    <>
      <button type="button" className={cls} onClick={onClick} aria-label={size === 'sm' ? cartStrings.addNamed(productName) : undefined}>
        {added ? cartStrings.added : cartStrings.add}
      </button>
      <span className="mk-sr" role="status">
        {added ? cartStrings.addedAnnounce(quantity) : ''}
      </span>
    </>
  );
}
