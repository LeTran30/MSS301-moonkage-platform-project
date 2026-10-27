import { useVendorContext, useVendorReload } from '@/entities/vendor';
import { LegalInfo } from '@/entities/vendor';
import { resubmitProfile } from '@/features/apply-to-sell';

/** B6.1 */
export function VendorLegalPage() {
  const reload = useVendorReload();
  return (
    <LegalInfo
      profile={useVendorContext()}
      onResubmit={async () => {
        await resubmitProfile();
        reload();
      }}
    />
  );
}
