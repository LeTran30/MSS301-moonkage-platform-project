import { OpenOnly } from '@/entities/vendor';
import { VendorDisbursements } from '@/features/request-disbursement';

/** B5.2 */
export function VendorDisbursementsPage() {
  return (
    <OpenOnly>
      <VendorDisbursements />
    </OpenOnly>
  );
}
