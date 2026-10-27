import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { vendorEntryStrings } from '../strings';

export type SellEntryStatus = 'none' | 'pending' | 'open';

/** One place, three labels by vendor status: not selling / profile waiting / shop open (plan section 5). */
export function SellEntryLink({ status, className }: { status: SellEntryStatus; className?: string }) {
  return (
    <Link to={status === 'none' ? routes.base.sellIntro : routes.vendor.overview} className={className}>
      {vendorEntryStrings.entry[status]}
    </Link>
  );
}
