import { OpenOnly } from '@/entities/vendor';
import { VendorRequestList } from '@/entities/vendor';

/** B3.0 */
export function VendorRequestsPage() {
  return (
    <OpenOnly>
      <VendorRequestList />
    </OpenOnly>
  );
}
