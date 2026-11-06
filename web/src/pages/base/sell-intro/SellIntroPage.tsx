import { routes } from '@/shared/config';
import { ButtonLink, Card, Icon } from '@/shared/ui';
import styles from './SellIntroPage.module.css';

export function SellIntroPage() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>HỢP TÁC KINH DOANH</span>
          <h1 className={styles.title}>
            Đưa Hương Vị Bánh Trung Thu Của Bạn Đến Hàng Triệu Khách Hàng
          </h1>
          <p className={styles.lead}>
            Moonkage cung cấp nền tảng số chuyên nghiệp cho các tiệm bánh gia truyền và xưởng sản
            xuất: nhận đơn mua lẻ hàng ngày và nhận hợp đồng quà tặng số lượng lớn từ các tập đoàn
            lớn.
          </p>
          <div className={styles.actions}>
            <ButtonLink
              to={routes.base.sellRegister}
              variant="primary"
              size="lg"
              iconRight="arrowRight"
            >
              Bắt đầu đăng ký người bán
            </ButtonLink>
          </div>
        </div>
        <div className={styles.heroMedia}>
          <img
            src="/images/xuong.jpg"
            alt="Xưởng làm bánh trung thu"
            className={styles.img}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className={styles.grid}>
        <Card padding="md" className={styles.benefitCard}>
          <Icon name="store" size={28} className={styles.benefitIcon} />
          <h3>Bán lẻ có sẵn tại Shop</h3>
          <p>
            Tự định giá, quản lý tồn kho, giao hàng linh hoạt theo tỉnh/thành hoặc chuyển phát toàn
            quốc.
          </p>
        </Card>
        <Card padding="md" className={styles.benefitCard}>
          <Icon name="factory" size={28} className={styles.benefitIcon} />
          <h3>Hợp đồng số lượng lớn</h3>
          <p>
            Nhận các yêu cầu báo giá doanh nghiệp từ 20 đến 10.000 hộp, gửi maket duyệt trực tuyến,
            nhận cọc bảo đảm.
          </p>
        </Card>
        <Card padding="md" className={styles.benefitCard}>
          <Icon name="shield" size={28} className={styles.benefitIcon} />
          <h3>Bảo chứng thanh toán</h3>
          <p>
            Sàn giữ tiền ký quỹ qua VNPay, tự động giải ngân theo từng mốc nguyên liệu và bàn giao
            sản phẩm.
          </p>
        </Card>
      </div>
    </div>
  );
}
