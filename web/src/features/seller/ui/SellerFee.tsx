import { PageHeader, Steps } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import type { SellerProfile } from '../api/types';
import { SELLER_FEE } from '../model/sellerModel';

/** B1.1: pay the one-off fee after approval (VNPay through the page). */
export function SellerFee({ profile, onPay, onLater }: { profile: SellerProfile; onPay: () => void; onLater: () => void }) {
  return (
    <div className="page">
      <PageHeader title="Đóng phí mở bán" />
      <Steps label="Mở bán" steps={['Nộp hồ sơ', 'Moonkage duyệt', 'Đóng phí', 'Cài vùng giao, đăng sản phẩm']} current={2} />
      <p className="notice">
        Đã duyệt · Hồ sơ {profile.shopName} được duyệt ngày {profile.approvedAt ?? '—'}.
      </p>
      <div className="detail-layout">
        <section className="panel panel--wide" aria-labelledby="after-fee">
          <h2 id="after-fee" className="detail-heading">
            Đóng phí xong bạn sẽ
          </h2>
          <ul className="cond-list">
            <li>Cài vùng giao và phí giao</li>
            <li>Đăng sản phẩm (nếu bật Shop) hoặc khai điều kiện nhận đặt hàng</li>
            <li>Bắt đầu nhận đơn</li>
          </ul>
        </section>
        <aside className="action-box" aria-labelledby="fee-heading">
          <h2 id="fee-heading" className="card-title-text">
            Phí mở bán
          </h2>
          <ul className="lines">
            <li className="lines__row">
              <span>Thu một lần</span>
              <span />
              <span className="mk-num">{formatVnd(SELLER_FEE)}</span>
            </li>
            <li className="lines__row lines__row--total">
              <span>Tổng</span>
              <span />
              <span className="mk-num">{formatVnd(SELLER_FEE)}</span>
            </li>
          </ul>
          <p className="muted">Hóa đơn phí tải ở Thông tin pháp lý.</p>
          <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={onPay}>
            Thanh toán qua VNPay
          </button>
          <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" onClick={onLater}>
            Để sau
          </button>
        </aside>
      </div>
    </div>
  );
}
