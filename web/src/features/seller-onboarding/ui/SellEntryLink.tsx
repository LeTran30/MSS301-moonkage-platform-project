import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { sellerStrings } from '../strings';

export type SellEntryStatus = 'none' | 'pending' | 'open';

/** One place, three labels by seller status: not selling / profile waiting / shop open (plan section 5). */
export function SellEntryLink({ status, className }: { status: SellEntryStatus; className?: string }) {
  return (
    <Link to={status === 'none' ? routes.sellIntro : routes.sellerChannel} className={className}>
      {sellerStrings.entry[status]}
    </Link>
  );
}
