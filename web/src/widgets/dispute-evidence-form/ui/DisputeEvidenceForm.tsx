import { useState } from 'react';
import { Badge, Button, Icon, Textarea, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import type { Dispute } from '@/entities/dispute';
import { useAddDisputeEvidence } from '@/features/file-complaint';
import { useFileUpload } from '@/features/file-upload';
import styles from './DisputeEvidenceForm.module.css';

/** EvidenceRequest.note: @Size(max = 1000). */
const NOTE_MAX = 1000;

interface DisputeEvidenceFormProps {
  orderId: string;
  /** Tiêu đề của khối, ví dụ "Gửi bằng chứng của Shop". */
  title: string;
  /** Gợi ý nên gửi gì. */
  hint: string;
  onAdded: (dispute: Dispute) => void;
}

/**
 * Thêm một bằng chứng vào khiếu nại đang mở (AC-49.1).
 *
 * Ảnh lên kho riêng của đơn trước (`POST /api/orders/uploads`), rồi
 * `POST /api/orders/{orderId}/dispute/evidences` gắn nó vào hồ sơ. Máy chủ biết
 * người gửi là người mua hay chủ Shop, nên form dùng chung cho cả hai bên.
 */
export function DisputeEvidenceForm({ orderId, title, hint, onAdded }: DisputeEvidenceFormProps) {
  const addEvidence = useAddDisputeEvidence();
  const upload = useFileUpload('ORDER');
  const { busy, run, error } = useAction();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  // Đổi key để trình duyệt quên tệp đã chọn sau khi gửi xong.
  const [inputKey, setInputKey] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error('Vui lòng chọn ảnh bằng chứng.');
      return;
    }
    void run(async () => {
      const tempKey = await upload.upload(file);
      if (!tempKey) {
        throw new Error('Không tải được ảnh lên kho lưu trữ. Vui lòng thử lại.');
      }
      const dispute = await addEvidence(orderId, {
        tempKey,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      toast.success('Đã gửi bằng chứng. Quản trị viên sẽ xem cùng hồ sơ khiếu nại.');
      setFile(null);
      setNote('');
      setInputKey((k) => k + 1);
      onAdded(dispute);
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.hint}>{hint}</p>
      </div>
      <label className={styles.picker}>
        <Icon name="image" size={18} />
        <span>Ảnh bằng chứng (JPG/PNG)</span>
        <input
          key={inputKey}
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Badge tone={file ? 'green' : 'neutral'} size="sm">
          {file ? file.name : 'Chọn ảnh'}
        </Badge>
      </label>
      <Textarea
        label="Ghi chú cho quản trị viên"
        rows={3}
        value={note}
        maxLength={NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ví dụ: Ảnh đóng gói trước khi giao cho đơn vị vận chuyển"
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={busy} disabled={busy}>
          Gửi bằng chứng
        </Button>
      </div>
    </form>
  );
}
