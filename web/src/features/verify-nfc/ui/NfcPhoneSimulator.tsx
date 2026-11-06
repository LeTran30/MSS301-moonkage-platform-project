import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon } from '@/shared/ui';
import { useCurrentUser } from '@/entities/user';
import styles from './NfcPhoneSimulator.module.css';

interface NfcPhoneSimulatorProps {
  /** Bước hiện tại của luồng app giả lập (V1 -> V5). */
  step: number;
  /** Người dùng đang mở màn hình (dùng cho thông tin CCCD ở V4). */
  user: ReturnType<typeof useCurrentUser>;
  /** Chuyển sang bước kế tiếp. */
  onStepChange: (step: number) => void;
  /** Người dùng xác nhận xong ở V5. */
  onFinish: () => void;
}

/**
 * Khung điện thoại giả lập ứng dụng Moonkage Verify theo Flutter_App_Plan (V1-V5).
 *
 * Tách riêng khỏi `NfcVerifyPage` để trang chỉ giữ phần điều phối trạng thái.
 */
export function NfcPhoneSimulator({
  step,
  user,
  onStepChange,
  onFinish,
}: NfcPhoneSimulatorProps) {
  const [appStep, setAppStep] = useState<number>(step);
  const lastExternalStep = useRef(step);

  // Đồng bộ khi trang đổi bước từ bên ngoài (ví dụ sau khi xác minh xong).
  useEffect(() => {
    if (lastExternalStep.current !== step) {
      lastExternalStep.current = step;
      setAppStep(step);
    }
  }, [step]);

  const goTo = useCallback(
    (next: number) => {
      lastExternalStep.current = next;
      setAppStep(next);
      onStepChange(next);
    },
    [onStepChange]
  );

  return (
    <aside className={styles.phoneSimulatorCol}>
      <div className={styles.phoneMock}>
        <div className={styles.phoneSpeaker} />
        <div className={styles.phoneScreen}>
          <div className={styles.phoneHeader}>
            <span>9:41</span>
            <strong>Moonkage Verify</strong>
            <Icon name="nfc" size={16} />
          </div>

          <div className={styles.phoneBody}>
            {appStep === 1 && (
              <div className={styles.appView}>
                <Badge tone="neutral" size="sm">
                  MÀN APP V1 · ĐĂNG NHẬP
                </Badge>
                <Icon name="shield" size={48} className={styles.appIcon} />
                <h4>Đăng nhập ứng dụng</h4>
                <p>Sử dụng tài khoản Moonkage để xác minh danh tính</p>
                <Button variant="primary" size="sm" block onClick={() => goTo(2)}>
                  Tiếp tục quét QR (V2)
                </Button>
              </div>
            )}

            {appStep === 2 && (
              <div className={styles.appView}>
                <Badge tone="neutral" size="sm">
                  MÀN APP V2 · QUÉT MÃ QR
                </Badge>
                <div className={styles.scannerBox}>
                  <Icon name="qr" size={64} />
                  <span>Hướng camera vào màn hình máy tính</span>
                </div>
                <Button variant="primary" size="sm" block onClick={() => goTo(3)}>
                  Mô phỏng: Quét thành công (V3)
                </Button>
              </div>
            )}

            {appStep === 3 && (
              <div className={styles.appView}>
                <Badge tone="gold" size="sm">
                  MÀN APP V3 · CHẠM THẺ NFC
                </Badge>
                <div className={styles.nfcWave}>
                  <Icon name="nfc" size={54} />
                </div>
                <h4>Áp thẻ CCCD gắn chip</h4>
                <p>Giữ cố định thẻ vào lưng điện thoại cho đến khi rung</p>
                <Button variant="gold" size="sm" block onClick={() => goTo(4)}>
                  Mô phỏng: Đọc chip xong (V4)
                </Button>
              </div>
            )}

            {appStep === 4 && (
              <div className={styles.appView}>
                <Badge tone="neutral" size="sm">
                  MÀN APP V4 · KIỂM TRA THÔNG TIN
                </Badge>
                <div className={styles.cccdData}>
                  <div>
                    Họ tên: <strong>{user.name}</strong>
                  </div>
                  <div>
                    Số CCCD: <strong>{user.idCardNumberMasked || '079203001234'}</strong>
                  </div>
                  <div>
                    Chip điện tử: <span className={styles.chipValid}>Hợp lệ (Bộ Công An)</span>
                  </div>
                </div>
                <div className={styles.appActionRow}>
                  <Button variant="primary" size="sm" block onClick={onFinish}>
                    Xác nhận &amp; Lưu (V5)
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => goTo(1)}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}

            {appStep === 5 && (
              <div className={styles.appView}>
                <Badge tone="green" size="sm">
                  MÀN APP V5 · HOÀN TẤT
                </Badge>
                <Icon name="check" size={48} className={styles.appIcon} />
                <h4>Định danh thành công!</h4>
                <p>Trình duyệt web của bạn sẽ tự động đồng bộ trạng thái ngay lập tức.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className={styles.simNote}>
        * Khung điện thoại giả lập ứng dụng di động theo Flutter_App_Plan (V1–V5).
      </p>
    </aside>
  );
}
