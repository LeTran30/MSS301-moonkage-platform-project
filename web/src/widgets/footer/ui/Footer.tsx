import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand info */}
          <div className={styles.brandCol}>
            <div className={styles.logo}>
              <span className={styles.logoEmblem}>
                <Icon name="lantern" size={24} />
              </span>
              <span className={styles.brandName}>Moonkage</span>
            </div>
            <p className={styles.tagline}>
              Sàn thương mại chuyên biệt về Bánh Trung Thu. Kết nối người mua lẻ, khách hàng doanh nghiệp và các nghệ nhân, xưởng làm bánh truyền thống trên toàn quốc.
            </p>
            <div className={styles.badges}>
              <span className={styles.verifyBadge}>
                <Icon name="shield" size={14} /> Xác thực NFC Căn Cước
              </span>
              <span className={styles.verifyBadge}>
                <Icon name="creditCard" size={14} /> Thanh toán đảm bảo VNPay
              </span>
            </div>
          </div>

          {/* Cột Mua hàng */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Mua Bánh</h4>
            <ul className={styles.linkList}>
              <li>
                <Link to={routes.base.catalog}>Mua lẻ bánh trung thu</Link>
              </li>
              <li>
                <Link to={routes.base.bulk}>Đặt số lượng lớn (doanh nghiệp)</Link>
              </li>
              <li>
                <Link to={routes.base.quoteRequestNew}>Tạo yêu cầu báo giá in logo</Link>
              </li>
              <li>
                <Link to={routes.base.vendors}>Danh sách đơn vị cung cấp &amp; xưởng</Link>
              </li>
              <li>
                <Link to={routes.account.orders}>Kiểm tra trạng thái đơn hàng</Link>
              </li>
            </ul>
          </div>

          {/* Cột Kênh người bán */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Dành Cho Người Bán</h4>
            <ul className={styles.linkList}>
              <li>
                <Link to={routes.base.sellIntro}>Bán hàng trên Moonkage</Link>
              </li>
              <li>
                <Link to={routes.base.sellRegister}>Đăng ký hồ sơ kinh doanh</Link>
              </li>
              <li>
                <Link to={routes.vendor.overview}>Kênh Quản Lý Bán Hàng</Link>
              </li>
              <li>
                <Link to={routes.vendor.fee}>Quy định phí mở bán &amp; đối soát</Link>
              </li>
            </ul>
          </div>

          {/* Cột Quy chế & Hỗ trợ */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Chính Sách &amp; Vận Hành</h4>
            <ul className={styles.linkList}>
              <li>
                <Link to={routes.base.policy}>Chính sách mua bán &amp; Giữ tiền</Link>
              </li>
              <li>
                <Link to={routes.base.policy}>Thời hạn khiếu nại &amp; Đổi hoàn</Link>
              </li>
              <li>
                <Link to={routes.system.sitemap}>Bản đồ cấu trúc 73 trang (IA)</Link>
              </li>
              <li>
                <Link to={routes.admin.overview}>Cổng Quản Trị Hệ Thống</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div>© 2026 Moonkage Platform. Xây dựng chuẩn theo Kiến Trúc Thông Tin v1.7.</div>
          <div className={styles.metaFlags}>
            <span>Mã nguồn: React 19 + TypeScript + CSS Modules (FSD Architecture)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
