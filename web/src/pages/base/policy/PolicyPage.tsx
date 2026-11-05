import { Card, Badge, Icon } from '@/shared/ui';
import styles from './PolicyPage.module.css';

export function PolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Chính sách sàn Moonkage</h1>
        <p className={styles.desc}>
          Quy chế vận hành, cơ chế bảo vệ giao dịch ký quỹ Escrow, thời hạn khiếu nại và cam kết
          chất lượng bánh trung thu.
        </p>
      </div>

      <div className={styles.cardsList}>
        <Card className={styles.policyCard}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>
              <Icon name="shield" size={26} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>1. Tiền của bạn được giữ an toàn</h2>
              <Badge tone="gold">Bảo chứng trung gian</Badge>
            </div>
          </div>
          <div className={styles.content}>
            <p>
              Toàn bộ số tiền người mua thanh toán (cả đơn bán lẻ lẫn tiền cọc đơn đặt hàng doanh
              nghiệp) được Moonkage tạm giữ trong tài khoản ký quỹ trung gian an toàn.
            </p>
            <ul>
              <li>
                <strong>Đối với đơn hàng bán sẵn:</strong> Tiền được giữ cho đến khi đơn hàng được
                giao thành công và hết hạn khiếu nại 48 giờ.
              </li>
              <li>
                <strong>Đối với đơn đặt hàng sản xuất (Bulk):</strong> Tiền cọc đợt 1 chỉ được giải
                ngân cho xưởng sau khi khách hàng đã chính thức ký duyệt mẫu thiết kế hộp và logo.
              </li>
              <li>
                <strong>Khi có khiếu nại phát sinh:</strong> Tiền liên quan đến đơn hàng lập tức bị
                đóng băng và không thể giải ngân cho đến khi đội vận hành Moonkage ban hành phán
                quyết.
              </li>
            </ul>
          </div>
        </Card>

        <Card className={styles.policyCard}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>
              <Icon name="scale" size={26} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>2. Thời hạn và Quy trình xử lý khiếu nại</h2>
              <Badge tone="red">Thời hạn 48 giờ</Badge>
            </div>
          </div>
          <div className={styles.content}>
            <p>
              Người mua có quyền tạo khiếu nại trong vòng{' '}
              <strong>48 giờ kể từ thời điểm nhận hàng thành công</strong> (hoặc kể từ lúc xưởng gửi
              mẫu thiết kế nếu có tranh chấp thiết kế).
            </p>
            <ul>
              <li>
                <strong>Bước 1:</strong> Người mua gửi hình ảnh mở hộp (unboxing), chụp rõ tem niêm
                phong và lý do khiếu nại.
              </li>
              <li>
                <strong>Bước 2:</strong> Người bán có <strong>24 giờ</strong> để phản hồi, giải
                trình hoặc đồng ý phương án bồi thường.
              </li>
              <li>
                <strong>Bước 3:</strong> Đội vận hành Moonkage tiến hành phân xử.{' '}
                <em>Quy tắc bất di biến:</em> Số tiền tối đa có thể hoàn không bao giờ vượt quá số
                tiền Moonkage đang giữ trong tài khoản ký quỹ.
              </li>
            </ul>
          </div>
        </Card>

        <Card className={styles.policyCard}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>
              <Icon name="factory" size={26} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>3. Tiêu chuẩn người bán & Đăng ký kinh doanh</h2>
              <Badge tone="neutral">Minh bạch pháp lý</Badge>
            </div>
          </div>
          <div className={styles.content}>
            <p>
              Nhằm đảm bảo an toàn vệ sinh thực phẩm và nguồn gốc xuất xứ truyền thống, sàn Moonkage
              chỉ tiếp nhận các đối tác đáp ứng:
            </p>
            <ul>
              <li>
                <strong>Mô hình hợp lệ:</strong> Bắt buộc là <em>Hộ kinh doanh cá thể</em> hoặc{' '}
                <em>Doanh nghiệp tư nhân</em> sản xuất thực phẩm có giấy chứng nhận ĐKKD còn hiệu
                lực.
              </li>
              <li>
                <strong>Định danh sinh trắc học:</strong> Người đại diện pháp luật bắt buộc phải xác
                thực CCCD gắn chip qua công nghệ đọc chip NFC (V1–V5).
              </li>
              <li>
                <strong>Kiểm duyệt sản phẩm:</strong> Sản phẩm niêm yết bắt buộc phải phân loại
                chuẩn Vỏ bánh & Nhân bánh theo danh mục do sàn quản lý.
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
