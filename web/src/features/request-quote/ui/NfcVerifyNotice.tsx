import { ButtonLink, Card, Icon } from '@/shared/ui';
import { routes } from '@/shared/config';
import styles from './QuoteRequestCards.module.css';

/**
 * The notice that asks the buyer to verify their chip ID before opening a
 * quote request (FR-04, M6.4).
 */
export function NfcVerifyNotice() {
  return (
    <Card tone="gold" padding="md" className={styles.nfcNotice}>
      <div className={styles.nfcIcon}>
        <Icon name="shield" size={24} />
      </div>
      <div className={styles.nfcText}>
        <h4>Yêu cầu bắt buộc: Xác minh danh tính NFC Căn cước công dân</h4>
        <p>
          Theo quy chế giao dịch số lượng lớn, bạn cần quét CCCD gắn chip qua ứng dụng Moonkage
          Verify để kích hoạt quyền tạo yêu cầu báo giá.
        </p>
      </div>
      <ButtonLink to={routes.account.verify} variant="gold" iconRight="arrowRight">
        Xác minh ngay
      </ButtonLink>
    </Card>
  );
}
