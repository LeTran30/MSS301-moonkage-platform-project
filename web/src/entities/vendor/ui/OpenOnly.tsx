import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { useVendorContext } from '../model/vendorChannelContext';

/** Pages that open only after approval and the fee (FR-27). */
export function OpenOnly({ children }: { children: ReactNode }) {
  const profile = useVendorContext();
  if (profile.state === 'open') return <>{children}</>;
  return (
    <div className="page page--narrow">
      <h1 className="title-text">Mở sau khi mở bán</h1>
      <p className="lead-text">Đơn hàng, yêu cầu báo giá, sản phẩm, tiền, vùng giao và điều kiện nhận đặt hàng mở sau khi hồ sơ được duyệt và đã đóng phí mở bán.</p>
      <Link to={routes.vendor.overview} className="mk-btn mk-btn--quiet">
        Về Tổng quan
      </Link>
    </div>
  );
}
