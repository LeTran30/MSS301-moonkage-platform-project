import { OpenOnly } from '@/entities/vendor';
import { useTerms } from '@/entities/vendor';
import { CustomTermsForm } from '@/features/edit-vendor-settings';
import { LoadingState } from '@/shared/ui';

/** B6.3 */
export function VendorTermsPage() {
  const terms = useTerms();
  if (terms.kind !== 'loaded') return <LoadingState />;
  return (
    <OpenOnly>
      <CustomTermsForm terms={terms.data} onSaved={() => undefined} />
    </OpenOnly>
  );
}
