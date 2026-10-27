import { Link } from 'react-router-dom';
import { AddressList } from '@/features/manage-addresses';
import { routes } from '@/shared/config/routes';
import { PageHeader } from '@/shared/ui';

/** M6.3 */
export function AddressesPage() {
  return (
    <div className="stack-lg">
      <PageHeader
        title="Địa chỉ giao hàng"
        actions={
          <Link to={routes.account.newAddress} className="mk-btn mk-btn--primary">
            Thêm địa chỉ
          </Link>
        }
      />
      <AddressList />
    </div>
  );
}
