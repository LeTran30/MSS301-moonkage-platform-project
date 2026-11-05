import { Badge, Button, ButtonLink, Card, Icon } from '@/shared/ui';
import type { User } from '@/entities/user';
import styles from './nfcVerifyUi.module.css';

interface NfcVerifiedPanelProps {
  user: User;
  /** Đường dẫn quay lại bước đang làm (nếu có). */
  returnUrl?: string;
}

/** Kết quả xác thực thành công (V5). */
export function NfcVerifiedPanel({ user, returnUrl }: NfcVerifiedPanelProps) {
  return (
    <div className={styles.verifiedBox}>
      <div className={styles.verifiedIconWrap}>
        <Icon name="shield" size={40} />
      </div>
      <h3>Tài khoản đã được xác minh thành công</h3>
      <p>
        Số định danh CCCD đã mã hóa an toàn:{' '}
        {/* Không có dữ liệu thì nói rõ là chưa có, không tự điền một số CCCD giả. */}
        <code>{user.idCardNumberMasked || 'Chưa có dữ liệu'}</code>
      </p>
      <p className={styles.verifiedNote}>
        Bạn có đầy đủ quyền tạo yêu cầu báo giá doanh nghiệp, chốt hợp đồng và mở Shop bán hàng.
      </p>
      {returnUrl && (
        <ButtonLink to={returnUrl} variant="primary" size="lg" iconRight="arrowRight">
          Quay lại bước đang làm
        </ButtonLink>
      )}
    </div>
  );
}

interface NfcStatusBadgeProps {
  isVerified: boolean;
}

/** Nhãn trạng thái định danh. */
export function NfcStatusBadge({ isVerified }: NfcStatusBadgeProps) {
  return (
    <Badge tone={isVerified ? 'green' : 'amber'} size="md">
      {isVerified ? 'ĐÃ ĐỊNH DANH' : 'CHƯA ĐỊNH DANH'}
    </Badge>
  );
}

interface NfcSessionCardProps {
  isVerified: boolean;
  user: User;
  returnUrl?: string;
  sessionId: string | null;
  timerLabel: string;
  busy: boolean;
  error?: string | null;
  onRefreshSession: () => void;
}

/** Thẻ QR phiên xác minh + hướng dẫn 3 bước (M6.4). */
export function NfcSessionCard({
  isVerified,
  user,
  returnUrl,
  sessionId,
  timerLabel,
  busy,
  error,
  onRefreshSession,
}: NfcSessionCardProps) {
  return (
    <Card padding="lg" className={styles.qrCard}>
      <div className={styles.statusRow}>
        <span>Trạng thái định danh:</span>
        <NfcStatusBadge isVerified={isVerified} />
      </div>

      {isVerified ? (
        <NfcVerifiedPanel user={user} returnUrl={returnUrl} />
      ) : (
        <div className={styles.unverifiedBox}>
          <div className={styles.qrBox}>
            <Icon name="qr" size={160} />
            <span className={styles.qrTimer}>Mã phiên QR làm mới sau {timerLabel}</span>
            {sessionId && (
              <code className={styles.sessionCode} aria-label="Mã phiên xác minh">
                {sessionId}
              </code>
            )}
          </div>
          <div className={styles.stepsGuide}>
            <div className={styles.step}>
              <span className={styles.stepIdx}>1</span>
              <span>
                Mở ứng dụng <strong>Moonkage Verify</strong> trên điện thoại có NFC.
              </span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepIdx}>2</span>
              <span>Quét mã QR trên màn hình này để bắt đầu phiên xác thực.</span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepIdx}>3</span>
              <span>Áp thẻ Căn cước công dân gắn chip vào mặt sau điện thoại.</span>
            </div>
          </div>

          <div className={styles.qrActions}>
            <Button
              variant="primary"
              size="md"
              loading={busy}
              disabled={busy}
              onClick={onRefreshSession}
            >
              Tạo mã QR mới
            </Button>
          </div>

          {error && (
            <p className={styles.pageError} role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
