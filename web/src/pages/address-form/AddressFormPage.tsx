import { useNavigate, useParams } from 'react-router-dom';
import { AddressForm, useAddress } from '../../features/addresses';
import { routes } from '../../shared/config/routes';
import { LoadingState, PageHeader } from '../../shared/ui';

/** M6.3.1: `/moi` adds, an id edits. */
export function AddressFormPage() {
  const { addressId = 'moi' } = useParams();
  const navigate = useNavigate();
  const isNew = addressId === 'moi';
  const address = useAddress(isNew ? '' : addressId);
  if (!isNew && address.kind === 'loading') return <LoadingState />;
  const back = () => navigate(-1);
  return (
    <div className="stack-lg page--narrow">
      <PageHeader title={isNew ? 'Thêm địa chỉ' : 'Sửa địa chỉ'} />
      <AddressForm
        key={addressId}
        address={!isNew && address.kind === 'loaded' ? address.data : null}
        onSaved={() => navigate(routes.addresses)}
        onCancel={back}
      />
    </div>
  );
}
