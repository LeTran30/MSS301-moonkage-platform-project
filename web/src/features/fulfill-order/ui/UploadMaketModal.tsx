import { Button, Icon, Modal, Textarea } from '@/shared/ui';
import styles from './fulfillOrderUi.module.css';

interface UploadMaketModalProps {
  open: boolean;
  maketFile: File | null;
  maketNote: string;
  busy: boolean;
  onMaketFileChange: (file: File | null) => void;
  onMaketNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/** Tải lên bản thiết kế maket cho khách duyệt (B2.1, Flow 2, FR-39). */
export function UploadMaketModal({
  open,
  maketFile,
  maketNote,
  busy,
  onMaketFileChange,
  onMaketNoteChange,
  onClose,
  onSubmit,
}: UploadMaketModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tải lên bản thiết kế mẫu (Maket) cho khách duyệt"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="primary" loading={busy} onClick={onSubmit}>
            Gửi Maket cho khách
          </Button>
        </>
      }
    >
      <div className={styles.modalContent}>
        <p className={styles.modalSub}>
          Tải lên bản vẽ thiết kế 2D/3D hộp quà, logo doanh nghiệp dập nổi và màu sắc quy chuẩn.
        </p>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="maket-file">
            Tệp thiết kế Maket *
          </label>
          <label className={styles.fileBox} htmlFor="maket-file">
            <Icon name="image" size={20} />
            <span>{maketFile ? maketFile.name : 'Chọn tệp thiết kế...'}</span>
            <input
              id="maket-file"
              type="file"
              className={styles.fileInput}
              accept="image/*,application/pdf"
              onChange={(e) => onMaketFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className={styles.formGroup}>
          <Textarea
            label="Ghi chú cho khách hàng"
            rows={3}
            value={maketNote}
            onChange={(e) => onMaketNoteChange(e.target.value)}
            placeholder="Nêu rõ chất liệu giấy, quy cách ép nhũ, lưu ý khi duyệt..."
          />
        </div>
      </div>
    </Modal>
  );
}
