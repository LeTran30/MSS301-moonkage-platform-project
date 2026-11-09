import { useState } from 'react';
import { Icon } from '@/shared/ui';
import { DOCUMENT_LABELS, uploadVendorDocument, type VendorDocumentKind } from '@/entities/vendor';
import type { UploadedVendorDocument } from '../model/vendorRegistrationForm';
import styles from './VendorSellingModeStep.module.css';

interface VendorDocumentUploadFieldProps {
  kind: VendorDocumentKind;
  value: UploadedVendorDocument | undefined;
  /** Lỗi của ô này (thiếu tệp, hoặc máy chủ từ chối). */
  error?: string;
  onUploaded: (document: UploadedVendorDocument) => void;
}

/**
 * Chọn và tải một giấy tờ của hồ sơ người bán lên kho (FR-26).
 *
 * Tệp đi thẳng lên kho qua link ký sẵn; form chỉ giữ `tempKey` và tên tệp.
 */
export function VendorDocumentUploadField({
  kind,
  value,
  error,
  onUploaded,
}: VendorDocumentUploadFieldProps) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputId = `vendor-document-${kind}`;
  const message = uploadError ?? error;

  const handleChange = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const tempKey = await uploadVendorDocument(file);
      onUploaded({ tempKey, fileName: file.name });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Không tải được tệp lên kho lưu trữ.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.uploadBox} htmlFor={inputId}>
        <Icon name="file" size={20} />
        <span className={styles.uploadName}>{DOCUMENT_LABELS[kind]} *</span>
        <span className={styles.uploadState}>
          {busy ? 'Đang tải lên…' : value ? value.fileName : 'Chọn ảnh hoặc tệp PDF'}
        </span>
        <input
          id={inputId}
          type="file"
          className={styles.fileInput}
          accept="image/*,application/pdf"
          disabled={busy}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${inputId}-error` : undefined}
          onChange={(e) => void handleChange(e.target.files?.[0])}
        />
      </label>
      {message && (
        <p id={`${inputId}-error`} role="alert" className={styles.fieldError}>
          {message}
        </p>
      )}
    </div>
  );
}
