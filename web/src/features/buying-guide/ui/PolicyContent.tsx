import { PageHeader, StatusBadge } from '../../../shared/ui';

/** M8.0: buying and selling policy. Content still waits for the team's approval (marked on the page). */
export function PolicyContent() {
  return (
    <div className="page page--narrow">
      <p className="notice">
        <StatusBadge tone="warn">Cần xác nhận</StatusBadge> Nội dung chờ nhóm duyệt.
      </p>
      <PageHeader title="Chính sách mua bán" />
      <nav aria-label="Trên trang này" className="row">
        <a href="#thoi-han" className="mk-btn mk-btn--text">
          Thời hạn báo vấn đề
        </a>
        <a href="#giu-tien" className="mk-btn mk-btn--text">
          Giữ tiền
        </a>
        <a href="#lien-tinh" className="mk-btn mk-btn--text">
          Giao liên tỉnh
        </a>
      </nav>
      <section id="thoi-han" className="stack prose">
        <h2 className="detail-heading">Thời hạn báo vấn đề với đơn</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Loại đơn</th>
              <th scope="col">Thời hạn sau khi giao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Có sẵn, nội thành</td>
              <td>3 ngày</td>
            </tr>
            <tr>
              <td>Có sẵn, liên tỉnh</td>
              <td>7 ngày</td>
            </tr>
            <tr>
              <td>Đặt theo yêu cầu</td>
              <td>7 ngày</td>
            </tr>
          </tbody>
        </table>
        <p>Hết hạn thì nút "Báo vấn đề với đơn" ẩn.</p>
      </section>
      <section id="giu-tien" className="stack prose">
        <h2 className="detail-heading">Giữ tiền</h2>
        <p>
          Moonkage giữ tiền người mua trả cho tới khi đơn giao xong và hết thời hạn báo vấn đề. Tiền cọc đơn đặt hàng được giải ngân cho người bán theo
          tiến độ, sau khi quản trị duyệt.
        </p>
      </section>
      <section id="lien-tinh" className="stack prose">
        <h2 className="detail-heading">Giao liên tỉnh</h2>
        <p>Người bán phải nhập mã vận đơn khi giao liên tỉnh. Phí giao liên tỉnh theo bảng Moonkage công bố.</p>
      </section>
    </div>
  );
}
