import { useNavigate } from 'react-router-dom';
import { Card, Button, toast, AsyncState, EmptyState } from '@/shared/ui';
import { useAsync, useAction } from '@/shared/lib';
import { addressApi, type Address } from '@/entities/address';
import { useDeleteAddress } from '@/features/edit-address';
import { routes } from '@/shared/config';
import styles from './AddressesPage.module.css';

/**
 * M6.3 — the delivery address book (FR-03).
 *
 * The list comes from `GET /api/addresses` of identity-service; the delete
 * button calls `DELETE /api/addresses/{addressId}` and reloads the list so the
 * screen shows what the backend really kept.
 */
export function AddressesPage() {
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const deleteAddress = useDeleteAddress();

  const asyncAddresses = useAsync<Address[]>(() => addressApi.list(), []);

  async function handleDelete(address: Address) {
    await run(async () => {
      await deleteAddress(address.id);
      toast.success('Đã xóa địa chỉ khỏi sổ địa chỉ.');
      asyncAddresses.reload();
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Địa chỉ nhận hàng đã lưu (M6.3, FR-03)</h3>
        <Button
          variant="primary"
          size="sm"
          iconLeft="plus"
          onClick={() => navigate(routes.account.addressNew)}
        >
          Thêm địa chỉ mới
        </Button>
      </div>

      <AsyncState state={asyncAddresses} onRetry={asyncAddresses.reload}>
        {(addresses) =>
          addresses.length === 0 ? (
            <EmptyState
              title="Chưa có địa chỉ nào"
              description="Thêm địa chỉ nhận hàng để checkout nhanh hơn."
            />
          ) : (
            <div className={styles.list}>
              {addresses.map((address) => (
                <Card key={address.id} padding="md" className={styles.card}>
                  <div className={styles.topRow}>
                    <div>
                      <strong>
                        {address.label || 'Địa chỉ nhận hàng'}
                        {address.isDefault ? ' (Mặc định)' : ''}
                      </strong>
                      <p>{address.fullAddress}</p>
                    </div>
                    {address.isDefault && <span className={styles.badgeDef}>Mặc định</span>}
                  </div>
                  <div className={styles.bottomRow}>
                    <span>
                      Người nhận: {address.recipientName} · {address.recipientPhone}
                    </span>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => navigate(routes.account.address(address.id))}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className={styles.delBtn}
                        disabled={busy}
                        onClick={() => void handleDelete(address)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      </AsyncState>
    </div>
  );
}
