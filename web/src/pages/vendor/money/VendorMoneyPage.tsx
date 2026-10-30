import { VendorMoneyOverview } from '@/entities/payout';
import { useVendorContext } from '@/entities/vendor';
import { OpenOnly } from '@/entities/vendor';

/** B5.0 */
export function VendorMoneyPage() {
  const profile = useVendorContext();
  return (
    <OpenOnly>
      <VendorMoneyOverview takesCustom={profile.ways.custom} />
    </OpenOnly>
  );
}
