import { useState } from 'react';
import { setNfcVerified } from '@/entities/user';
import { Button, Modal, toast } from '@/shared/ui';
import styles from './NfcVerificationSimulator.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NfcVerificationSimulator({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [scanning, setScanning] = useState(false);

  const handleStartScan = () => {
    setScanning(true);
    setTimeout(() => {
      setStep(2);
      setTimeout(() => {
        setStep(3);
        setScanning(false);
        setNfcVerified();
        toast.success('Xác thực thẻ CCCD gắn chip qua NFC thành công! Danh tính đã được ký số.');
        // `onSuccess` **không** được gọi ở đây: bước 3 là nơi người dùng
        // đọc kết quả và bấm "Hoàn tất". Gọi sớm sẽ đóng modal ngay, khiến
        // bước 3 không bao giờ hiển thị.
      }, 1200);
    }, 1000);
  };

  const handleFinish = () => {
    onSuccess?.();
    onClose();
  };

  const handleReset = () => {
    setStep(1);
    setScanning(false);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleReset}
      title="Giả lập định danh CCCD gắn chip NFC (Flow 6 - V1-V5)"
    >
      <div className={styles.modalContent}>
        {step === 1 && (
          <div className={styles.stepContainer}>
            <div className={styles.iconWrap}>📱</div>
            <h3>Bước 1: Chạm thẻ CCCD vào mặt lưng điện thoại</h3>
            <p className={styles.desc}>
              Mô phỏng giao thức truyền tải tín hiệu qua tần số 13.56 MHz, trích xuất dữ liệu công dân có chữ ký số Bộ Công An.
            </p>
            <Button variant="primary" loading={scanning} onClick={handleStartScan}>
              {scanning ? 'Đang đọc thẻ...' : 'Bắt đầu quét NFC'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContainer}>
            <div className={`${styles.iconWrap} ${styles.pulse}`}>🛡️</div>
            <h3>Bước 2: Đối chiếu sinh trắc học khuôn mặt</h3>
            <p className={styles.desc}>
              Hệ thống đang so khớp dữ liệu hình ảnh từ chip CCCD với camera thời gian thực...
            </p>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContainer}>
            <div className={styles.iconWrap}>✅</div>
            <h3>Bước 3: Xác thực thành công!</h3>
            <p className={styles.desc}>
              Hồ sơ công dân hợp lệ. Bạn đã đủ điều kiện kích hoạt gian hàng người bán (BR-33).
            </p>
            <Button variant="primary" onClick={handleFinish}>
              Hoàn tất
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
