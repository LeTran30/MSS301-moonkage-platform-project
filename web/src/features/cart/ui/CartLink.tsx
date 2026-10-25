import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { useCart } from '../model/useCart';
import { cartStrings } from '../strings';

/** Cart action of the DS NavBar: icon, "Giỏ", and the box count. */
export function CartLink() {
  const { count } = useCart();
  return (
    <Link to={routes.cart} aria-label={cartStrings.linkLabel(count)}>
      <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
        <circle cx="9" cy="20" r="1.2" />
        <circle cx="17" cy="20" r="1.2" />
      </svg>
      {count > 0 && (
        <span className="mk-nav__count mk-num" aria-hidden="true">
          {count}
        </span>
      )}
      {cartStrings.short}
    </Link>
  );
}
