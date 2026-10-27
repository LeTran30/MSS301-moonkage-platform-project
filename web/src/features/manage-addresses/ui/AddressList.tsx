import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatAddress, useAddresses, type Address } from '@/entities/address';
import { routes } from '@/shared/config/routes';
import { Dialog, EmptyState, ErrorState, LoadingState, StatusBadge } from '@/shared/ui';
import { deleteAddress, setDefaultAddress } from '../api/manageAddressesApi';
import styles from './AddressList.module.css';

/** M6.3 with the delete confirmation (M6.3.2). */
export function AddressList() {
  const state = useAddresses();
  const [toDelete, setToDelete] = useState<Address | null>(null);
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;

  const run = async (fn: () => Promise<unknown>) => {
    await fn();
    state.reload();
  };

  return (
    <>
      {state.data.length === 0 ? (
        <EmptyState title="Chưa có địa chỉ" body="Thêm địa chỉ để thanh toán nhanh hơn." />
      ) : (
        <ul className={`${styles.list} address-list`}>
          {state.data.map((a) => (
            <li key={a.id} className={`${styles.card} address-card`}>
              <div>
                <p className={`${styles.cardHead} body-strong-text`}>
                  {a.label} {a.isDefault && <StatusBadge tone="soft">Mặc định</StatusBadge>}
                </p>
                <p className="muted">
                  {a.name} · {a.phone}
                </p>
                <p>{formatAddress(a)}</p>
              </div>
              <div className="row">
                <Link to={routes.account.address(a.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                  Sửa
                </Link>
                {!a.isDefault && (
                  <>
                    <button type="button" className="mk-btn mk-btn--text" onClick={() => run(() => setDefaultAddress(a.id))}>
                      Đặt làm mặc định
                    </button>
                    <button type="button" className="mk-btn mk-btn--text" onClick={() => setToDelete(a)}>
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={toDelete !== null} title={`Xóa địa chỉ "${toDelete?.label ?? ''}"?`} onClose={() => setToDelete(null)}>
        {toDelete && (
          <>
            <p>{formatAddress(toDelete)}. Đơn đã đặt tới địa chỉ này không bị ảnh hưởng.</p>
            <div className={`${styles.actions} form-actions`}>
              <button type="button" className="mk-btn mk-btn--quiet" onClick={() => setToDelete(null)}>
                Giữ lại
              </button>
              <button
                type="button"
                className="mk-btn mk-btn--primary"
                onClick={() =>
                  run(async () => {
                    await deleteAddress(toDelete.id);
                    setToDelete(null);
                  })
                }
              >
                Xóa địa chỉ
              </button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
