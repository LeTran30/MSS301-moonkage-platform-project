import { routes } from '@/shared/config';
import { Badge, ButtonLink, Card, Icon } from '@/shared/ui';
import styles from './BulkHubPage.module.css';

export function BulkHubPage() {
  return (
    <div className={styles.container}>
      {/* Header trung chuyển */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>ĐẶT SỐ LƯỢNG LỚN · GIẢI PHÁP DOANH NGHIỆP</div>
        <h1 className={styles.title}>Bánh Trung Thu Doanh Nghiệp &amp; Đặt Theo Yêu Cầu</h1>
        <p className={styles.lead}>
          Giải pháp quà tặng trung thu tối ưu: In ấn logo nhận diện, xuất hóa đơn tài chính đầy đủ,
          cam kết tiến độ và chất lượng bởi sàn Moonkage.
        </p>
      </div>

      {/* Two choices explanation per IA Note */}
      <div className={styles.grid}>
        {/* Cách 1: Gửi yêu cầu mở */}
        <Card padding="lg" tone="gold" interactive className={styles.methodCard}>
          <div className={styles.iconGold}>
            <Icon name="sparkle" size={32} />
          </div>
          <div className={styles.cardContent}>
            <Badge tone="gold" size="sm">
              CÁCH 1: GỬI NHIỀU NƠI
            </Badge>
            <h2 className={styles.methodTitle}>Tạo 1 yêu cầu để nhiều xưởng báo giá</h2>
            <p className={styles.methodDesc}>
              Phù hợp khi bạn chưa chọn được xưởng hoặc muốn so sánh đơn giá, tiến độ giao hàng và
              chính sách cọc giữa các bên.
            </p>
            <ul className={styles.featureList}>
              <li>
                <Icon name="check" size={14} /> Điền thông tin số lượng, ngày cần giao và ngân sách
              </li>
              <li>
                <Icon name="check" size={14} /> Tải file logo để xưởng tư vấn làm maket
              </li>
              <li>
                <Icon name="check" size={14} /> Nhận bảng so sánh báo giá cạnh nhau trực quan
              </li>
            </ul>
            <ButtonLink
              to={routes.base.quoteRequestNew}
              variant="gold"
              size="lg"
              iconRight="arrowRight"
              block
            >
              Tạo yêu cầu báo giá ngay
            </ButtonLink>
          </div>
        </Card>

        {/* Cách 2: Chọn 1 xưởng cụ thể */}
        <Card padding="lg" interactive className={styles.methodCard}>
          <div className={styles.iconRed}>
            <Icon name="factory" size={32} />
          </div>
          <div className={styles.cardContent}>
            <Badge tone="red" size="sm">
              CÁCH 2: CHỌN MỘT ĐƠN VỊ
            </Badge>
            <h2 className={styles.methodTitle}>Xem danh sách xưởng &amp; gửi yêu cầu riêng</h2>
            <p className={styles.methodDesc}>
              Phù hợp khi bạn đã nhắm một nghệ nhân hoặc hiệu bánh phố cổ cụ thể, muốn xem hồ sơ
              năng lực và trao đổi trực tiếp.
            </p>
            <ul className={styles.featureList}>
              <li>
                <Icon name="check" size={14} /> Xem hồ sơ điều kiện nhận đặt hàng, số lượng tối
                thiểu
              </li>
              <li>
                <Icon name="check" size={14} /> Bảng giá tham khảo theo từng bậc số lượng
              </li>
              <li>
                <Icon name="check" size={14} /> Gửi yêu cầu đặt hàng riêng chỉ gửi tới đơn vị đó
              </li>
            </ul>
            <ButtonLink
              to={routes.base.vendors}
              variant="secondary"
              size="lg"
              iconRight="chevronRight"
              block
            >
              Xem danh sách đơn vị cung cấp
            </ButtonLink>
          </div>
        </Card>
      </div>

      {/* Cam kết quy trình 6 bước */}
      <section className={styles.processSection}>
        <h3 className={styles.processTitle}>Quy trình đặt bánh số lượng lớn trên Moonkage</h3>
        <div className={styles.stepsGrid}>
          <div className={styles.stepItem}>
            <span className={styles.stepNum}>01</span>
            <strong>Gửi yêu cầu</strong>
            <span>Nhập số lượng, hạn giao, tải file logo</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNum}>02</span>
            <strong>So sánh giá</strong>
            <span>Xem báo giá đơn giá, chiết khấu, ngày giao</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNum}>03</span>
            <strong>Đặt cọc ký quỹ</strong>
            <span>Chấp nhận báo giá &amp; đặt cọc qua VNPay</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNum}>04</span>
            <strong>Duyệt maket</strong>
            <span>Xưởng gửi bản thiết kế hộp in logo trực tuyến</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNum}>05</span>
            <strong>Cập nhật tiến độ</strong>
            <span>Theo dõi ảnh đúc bánh, bao bì theo thời gian thực</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNum}>06</span>
            <strong>Nghiệm thu &amp; Hóa đơn</strong>
            <span>Nhận bánh đủ số lượng, tải hóa đơn GTGT</span>
          </div>
        </div>
      </section>
    </div>
  );
}
