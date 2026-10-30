import { OpenOnly } from '@/entities/vendor';
import { useInterProvinceFees, useZones } from '@/entities/vendor';
import { DeliveryZonesForm } from '@/features/edit-vendor-settings';
import { LoadingState } from '@/shared/ui';

/** B6.2 */
export function VendorZonesPage() {
  const zones = useZones();
  const fees = useInterProvinceFees();
  if (zones.kind !== 'loaded' || fees.kind !== 'loaded') return <LoadingState />;
  return (
    <OpenOnly>
      <DeliveryZonesForm zones={zones.data} fees={fees.data} onSaved={() => undefined} />
    </OpenOnly>
  );
}
