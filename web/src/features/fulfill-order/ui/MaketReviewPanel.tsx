import { Badge, Button, Card } from '@/shared/ui';
import type { MaketVersion } from '@/entities/order';
import styles from './MaketReviewPanel.module.css';

interface MaketReviewPanelProps {
  /** Logo khách hàng gửi lên để xưởng dựng maket. */
  customLogo?: string;
  /** Bản maket đang hiển thị (mới nhất). */
  currentMaket?: MaketVersion;
  busy: boolean;
  error?: string | null;
  /** Duyệt bản maket để chuyển sang sản xuất. */
  onApprove: () => void;
  /** Yêu cầu xưởng chỉnh sửa bản maket. */
  onRequestRevision: () => void;
}

/**
 * Bản thiết kế maket in logo hộp quà (M6.1.2, FR-20).
 *
 * Người mua duyệt hoặc yêu cầu chỉnh sửa bản maket mới nhất của đơn số lượng lớn.
 */
export function MaketReviewPanel({
  customLogo,
  currentMaket,
  busy,
  error,
  onApprove,
  onRequestRevision,
}: MaketReviewPanelProps) {
  return (
    <Card padding="lg" className={styles.card}>
      <div className={styles.maketHeader}>
        <div>
          <h3 className={styles.cardTitle}>Phiên bản Maket in logo hộp quà</h3>
          <p className={styles.maketSub}>
            Xưởng thực hiện theo mẫu logo bạn đã gửi: <strong>{customLogo}</strong>
          </p>
        </div>
        <Badge tone={currentMaket?.status === 'APPROVED' ? 'green' : 'red'}>
          {currentMaket?.status === 'APPROVED' ? 'ĐÃ DUYỆT BẢN NÀY' : 'ĐANG CHỜ BẠN DUYỆT'}
        </Badge>
      </div>

      <div className={styles.maketPreview}>
        <img
          src={currentMaket?.imageUrl || '/images/doanh-nghiep.jpg'}
          alt="Bản vẽ maket"
          className={styles.maketImage}
          loading="lazy"
          decoding="async"
        />
        <div className={styles.maketCaption}>
          <strong>Bản thiết kế số #{currentMaket?.version}</strong>
          <p>{currentMaket?.comment}</p>
          {currentMaket?.feedback && (
            <p className={styles.maketFeedback}>Yêu cầu chỉnh sửa: {currentMaket.feedback}</p>
          )}
        </div>
      </div>

      {currentMaket?.status !== 'APPROVED' && (
        <div className={styles.maketActions}>
          <Button
            variant="primary"
            size="lg"
            iconLeft="check"
            loading={busy}
            disabled={busy}
            onClick={onApprove}
          >
            Đồng ý duyệt bản maket này (Chuyển sản xuất)
          </Button>

          <Button variant="secondary" size="lg" disabled={busy} onClick={onRequestRevision}>
            Yêu cầu xưởng chỉnh sửa lại
          </Button>

          {error && (
            <p className={styles.maketError} role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
