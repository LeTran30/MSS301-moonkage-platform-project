import { VendorSettlements } from '@/entities/payout';
import { OpenOnly } from '@/entities/vendor';

/** B5.1 */
export function VendorSettlementsPage() {
  return (
    <OpenOnly>
      <VendorSettlements />
    </OpenOnly>
  );
}
