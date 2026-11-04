import { Button, Icon, Input, Modal } from '@/shared/ui';
import styles from './fulfillOrderUi.module.css';

interface AttachInvoiceModalProps {
  open: boolean;
  invoiceNumber: string;
  invoiceFile: File | null;
  busy: boolean;
  onInvoiceNumberChange: (value: string) => void;
  onInvoiceFileChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/** Gắn hóa đơn VAT điện tử cho đơn (B2.2, FR-44). */
export function AttachInvoiceModal({
  open,
  invoiceNumber,
  invoiceFile,
  busy,
  onInvoiceNumberChange,
  onInvoiceFileChange,
  onClose,
  onSubmit,
}: AttachInvoiceModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gắn hóa đơn VAT điện tử (FR-44)"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" loading={busy} onClick={onSubmit}>
            Lưu hóa đơn
          </Button>
        </>
      }
    >
      <div className={styles.modalContent}>
        <p className={styles.modalSub}>
          Theo quy định Moonkage, người bán xuất hóa đơn điện tử và gắn tệp hóa đơn trước khi
          yêu cầu đối soát giải ngân.
        </p>
        <div className={styles.formGroup}>
          <label className={styles.label}>Số hóa đơn điện tử / Ký hiệu *</label>
          <Input
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(e.target.value)}
            placeholder="VD: 1C26TAA-0001293"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Tệp hóa đơn (PDF hoặc ảnh) *</label>
          <label className={styles.fileBox}>
            <Icon name="file" size={20} />
            <span>{invoiceFile ? invoiceFile.name : 'Chọn tệp hóa đơn...'}</span>
            <input
              type="file"
              className={styles.fileInput}
              accept="image/*,application/pdf"
              onChange={(e) => onInvoiceFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}
