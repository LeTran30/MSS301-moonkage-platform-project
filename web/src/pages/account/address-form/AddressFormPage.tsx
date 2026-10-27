import { useNavigate, useParams } from 'react-router-dom';
import { useAddress } from '@/entities/address';
import { AddressForm } from '@/features/manage-addresses';
import { newItemSlug, routes } from '@/shared/config/routes';
import { LoadingState, PageHeader } from '@/shared/ui';

/** M6.3.1: `/new` adds, an id edits. */
export function AddressFormPage() {
  const { addressId = newItemSlug } = useParams();
  const navigate = useNavigate();
  const isNew = addressId === newItemSlug;
  const address = useAddress(isNew ? '' : addressId);
  if (!isNew && address.kind === 'loading') return <LoadingState />;
  const back = () => navigate(-1);
  return (
    <div className="stack-lg page--narrow">
      <PageHeader title={isNew ? 'Thêm địa chỉ' : 'Sửa địa chỉ'} />
      <AddressForm
        key={addressId}
        address={!isNew && address.kind === 'loaded' ? address.data : null}
        onSaved={() => navigate(routes.account.addresses)}
        onCancel={back}
      />
    </div>
  );
}
