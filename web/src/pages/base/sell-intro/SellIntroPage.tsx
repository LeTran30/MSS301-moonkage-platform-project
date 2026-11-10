import { routes } from '@/shared/config';
import { ButtonLink, Card, Icon } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { useRegistrationFeeConfig } from '@/entities/vendor';
import styles from './SellIntroPage.module.css';

/** M7.0 — giới thiệu bán hàng: lợi ích, điều kiện (BR-23, BR-27, BR-33) và phí mở bán (BR-31). */
export function SellIntroPage() {
  // Mức phí đọc từ máy chủ (FR-53); chưa tải xong thì không hiện con số.
  const asyncFee = useRegistrationFeeConfig();
  const feeAmount = asyncFee.kind === 'loaded' ? (asyncFee.data?.amount ?? null) : null;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Đưa bánh trung thu của bạn tới thêm nhiều khách hàng
          </h1>
          <p className={styles.lead}>
            Mở Shop để bán hộp bánh có sẵn, hoặc nhận đặt hàng số lượng lớn qua báo giá. Bạn chọn
            một hoặc cả hai cách bán khi khai hồ sơ.
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
            Nhận yêu cầu đặt hàng, gửi báo giá và maket để người mua duyệt, nhận tiền cọc trước khi
            sản xuất.
          </p>
        </Card>
        <Card padding="md" className={styles.benefitCard}>
          <Icon name="shield" size={28} className={styles.benefitIcon} />
          <h3>Thanh toán qua sàn</h3>
          <p>
            Người mua trả qua VNPay, Moonkage giữ tiền đến khi đơn hoàn tất. Bạn xin giải ngân một
            phần tiền cọc để mua nguyên liệu, đội vận hành duyệt.
          </p>
        </Card>
      </div>

      <div className={styles.grid}>
        <Card padding="md" className={styles.benefitCard}>
          <h3>Ai đăng ký được</h3>
          <p>
            Hộ kinh doanh và doanh nghiệp tư nhân. Tài khoản nộp hồ sơ phải đã xác minh CCCD bằng
            NFC, và là chính chủ hộ / chủ doanh nghiệp ghi trên giấy chứng nhận đăng ký.
          </p>
        </Card>
        <Card padding="md" className={styles.benefitCard}>
          <h3>Cần chuẩn bị</h3>
          <p>
            Mã số thuế, địa chỉ trụ sở, giấy chứng nhận đăng ký kinh doanh, giấy tờ an toàn thực
            phẩm và tài khoản ngân hàng nhận tiền.
          </p>
        </Card>
        <Card padding="md" className={styles.benefitCard}>
          <h3>Phí mở bán</h3>
          <p>
            {feeAmount === null ? 'Phí mở bán' : `${formatCurrency(feeAmount)} (mức hiện hành)`},
            đóng một lần sau khi hồ sơ được duyệt. Không thu phí khi nộp hồ sơ.
          </p>
        </Card>
      </div>

      <p className={styles.companyNote}>
        Bạn đại diện cho công ty TNHH, công ty cổ phần hoặc công ty hợp danh? Khối công ty chưa
        đăng ký trực tuyến được; vui lòng liên hệ trực tiếp đội vận hành Moonkage để làm việc và ký
        thỏa thuận hợp tác.
      </p>
    </div>
  );
}
