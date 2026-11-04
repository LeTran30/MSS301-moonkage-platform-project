import { Button, Modal, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useState } from 'react';
import { useAttachVendorDocument } from '../model/useAttachVendorDocument';
import { createUploadLink, uploadFileToLink } from '@/shared/api';
import styles from './attachVendorDocumentUi.module.css';

interface AttachVendorDocumentModalProps {
  open: boolean;
  /** The shop whose registration fee invoice the admin attaches. */
  vendorId: string | null;
  vendorName?: string;
  onClose: () => void;
  onAttached: () => void;
}

/**
 * The admin attaches the registration fee invoice of a shop (Q-36, AC-27.6).
 *
 * Step 1 asks the backend for a signed link (`POST /api/vendors/uploads`),
 * step 2 sends the bytes straight to the object storage, step 3 sends the
 * `tempKey` as `objectKey` (`POST /api/vendors/{vendorId}/documents`).
 */
export function AttachVendorDocumentModal({
  open,
  vendorId,
  vendorName,
  onClose,
  onAttached,
}: AttachVendorDocumentModalProps) {
  const { busy, run, error } = useAction();
  const attachDocument = useAttachVendorDocument();
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleAttach(file: File) {
    if (!vendorId) return;
    await run(async () => {
      const link = await createUploadLink('VENDOR', file.type || 'application/octet-stream', file.size);
      if (!link?.tempKey) {
        throw new Error('Máy chủ không trả về liên kết tải tệp lên.');
      }
      await uploadFileToLink(link, file);
      await attachDocument(vendorId, { kind: 'FEE_INVOICE', objectKey: link.tempKey });
      toast.success(`Đã gắn hoá đơn phí đăng ký cho "${vendorName ?? vendorId}".`);
      setFileName(null);
      onAttached();
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Gắn hoá đơn phí đăng ký: ${vendorName ?? ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <p className={styles.hint}>
          Hoá đơn phí đăng ký được quản trị gắn sau khi người bán nộp phí thành công
          (Q-36). Tài liệu được lưu ở kho riêng tư, người bán không tự gắn được.
        </p>

        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}

        <label className={styles.label} htmlFor="fee-invoice-file">
          Chọn file hoá đơn (PDF hoặc ảnh)
        </label>
        <input
          id="fee-invoice-file"
          type="file"
          accept="application/pdf,image/*"
          disabled={busy || !vendorId}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileName(file?.name ?? null);
            if (file) void handleAttach(file);
            e.target.value = '';
          }}
        />
        {fileName && <span className={styles.hint}>Đang xử lý: {fileName}</span>}
      </div>
    </Modal>
  );
}
