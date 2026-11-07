import { useState } from 'react';
import { Badge, Button, Card, ProductImage, Textarea } from '@/shared/ui';
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
  /** Yêu cầu xưởng chỉnh sửa bản maket; `feedback` nói rõ cần sửa gì (FR-20). */
  onRequestRevision: (feedback: string) => void;
}

const MAKET_BADGE: Record<MaketVersion['status'], { tone: 'green' | 'gold' | 'red'; label: string }> = {
  PENDING: { tone: 'red', label: 'ĐANG CHỜ BẠN DUYỆT' },
  APPROVED: { tone: 'green', label: 'ĐÃ DUYỆT BẢN NÀY' },
  REJECTED: { tone: 'gold', label: 'ĐÃ GỬI YÊU CẦU SỬA' },
};

/**
 * Bản thiết kế maket in logo hộp quà (M6.1.2, FR-20).
 *
 * Người mua duyệt hoặc yêu cầu chỉnh sửa bản maket mới nhất của đơn số lượng lớn. Ảnh và các nút nằm cạnh
 * nhau để duyệt được mà không phải cuộn; góp ý sửa nhập ngay trong bảng.
 */
export function MaketReviewPanel({
  customLogo,
  currentMaket,
  busy,
  error,
  onApprove,
  onRequestRevision,
}: MaketReviewPanelProps) {
  const [revising, setRevising] = useState(false);
  const [feedback, setFeedback] = useState('');
  const badge = currentMaket ? MAKET_BADGE[currentMaket.status] : null;

  function submitRevision() {
    if (!feedback.trim()) return;
    onRequestRevision(feedback.trim());
    setRevising(false);
    setFeedback('');
  }

  return (
    <Card padding="lg" className={styles.card}>
      <div className={styles.maketHeader}>
        <div>
          <h3 className={styles.cardTitle}>Phiên bản Maket in logo hộp quà</h3>
          {customLogo && (
            <p className={styles.maketSub}>
              Xưởng thực hiện theo mẫu logo bạn đã gửi: <strong>{customLogo}</strong>
            </p>
          )}
        </div>
        {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
      </div>

      <div className={styles.maketPreview}>
        <a
          href={currentMaket?.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.maketImageLink}
          aria-label="Mở maket cỡ lớn"
        >
          <ProductImage
            src={currentMaket?.imageUrl}
            alt="Bản vẽ maket"
            className={styles.maketImage}
            fallbackIcon="image"
          />
        </a>

        <div className={styles.maketSide}>
          <div className={styles.maketCaption}>
            <strong>Bản thiết kế số #{currentMaket?.version}</strong>
            <p>Bấm vào ảnh để xem cỡ lớn.</p>
            {currentMaket?.status === 'REJECTED' && currentMaket.comment && (
              <p className={styles.maketFeedback}>Yêu cầu chỉnh sửa: {currentMaket.comment}</p>
            )}
            {currentMaket?.status === 'REJECTED' && <p>Xưởng sẽ gửi bản maket mới để bạn duyệt lại.</p>}
          </div>

          {currentMaket?.status === 'PENDING' && (
            <div className={styles.maketActions}>
              {revising ? (
                <>
                  <Textarea
                    label="Bạn muốn xưởng sửa gì?"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Ví dụ: đổi màu quai túi, phóng to logo"
                  />
                  <div className={styles.maketButtons}>
                    <Button variant="primary" loading={busy} disabled={!feedback.trim()} onClick={submitRevision}>
                      Gửi yêu cầu sửa
                    </Button>
                    <Button variant="ghost" disabled={busy} onClick={() => setRevising(false)}>
                      Hủy
                    </Button>
                  </div>
                </>
              ) : (
                <div className={styles.maketButtons}>
                  <Button variant="primary" iconLeft="check" loading={busy} disabled={busy} onClick={onApprove}>
                    Duyệt bản này
                  </Button>
                  <Button variant="secondary" disabled={busy} onClick={() => setRevising(true)}>
                    Yêu cầu sửa
                  </Button>
                </div>
              )}
              <p className={styles.maketSub}>Duyệt xong, xưởng mới được đưa đơn vào sản xuất.</p>
            </div>
          )}

          {error && (
            <p className={styles.maketError} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
