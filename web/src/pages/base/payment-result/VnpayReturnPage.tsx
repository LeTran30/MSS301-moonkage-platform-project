import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchVnpayReturn } from '@/entities/payment';
import { ApiError } from '@/shared/api/client';
import { routes } from '@/shared/config/routes';
import { EmptyState, LoadingState } from '@/shared/ui';

const RETURN_UNREADABLE_MSG = 'Không đọc được kết quả VNPay gửi về.';

/** M4.3, the VNPay redirect: payment-service checks the query and says which payment it was; its result page follows. */
export function VnpayReturnPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    fetchVnpayReturn(new URLSearchParams(search))
      .then((payment) => current && navigate(routes.base.paymentResult(payment.id), { replace: true }))
      .catch((e: unknown) => current && setError(e instanceof ApiError ? e.message : RETURN_UNREADABLE_MSG));
    return () => {
      current = false;
    };
  }, [search, navigate]);

  if (!error) return <LoadingState label="Đang xác nhận thanh toán với VNPay…" />;
  return (
    <div className="shop__inner page">
      <EmptyState title={RETURN_UNREADABLE_MSG} body={error}>
        <Link to={routes.account.orders} className="mk-btn mk-btn--quiet">
          Về Đơn hàng
        </Link>
      </EmptyState>
    </div>
  );
}
