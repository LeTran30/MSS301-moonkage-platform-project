import { OpenOnly } from '@/entities/vendor';
import { VendorProductList } from '@/features/edit-product';

/** B4.0 */
export function VendorProductsPage() {
  return (
    <OpenOnly>
      <VendorProductList />
    </OpenOnly>
  );
}
