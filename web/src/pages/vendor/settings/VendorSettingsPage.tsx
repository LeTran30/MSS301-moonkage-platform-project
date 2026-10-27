import { useVendorContext } from '@/entities/vendor';
import { SettingsHub } from '@/entities/vendor';

/** B6.0 */
export function VendorSettingsPage() {
  return <SettingsHub profile={useVendorContext()} />;
}
