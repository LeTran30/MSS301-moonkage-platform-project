import { useState } from 'react';
import { Button, Modal, Radio, Textarea } from '@/shared/ui';
import styles from './DeclineInvitationModal.module.css';

/** The reasons a Shop most often gives; "Lý do khác" lets it write its own. */
const COMMON_REASONS = [
  'Không kịp hạn giao khách cần',
  'Số lượng vượt quá năng lực sản xuất hiện tại',
  'Chưa làm được loại tùy chỉnh khách yêu cầu',
] as const;
const OTHER_REASON = 'OTHER';

interface DeclineInvitationModalProps {
  open: boolean;
  /** The request's short code, shown in the title. */
  requestCode: string;
  busy?: boolean;
  onClose: () => void;
  onDecline: (reason: string) => void;
}

/**
 * AC-36.3: the Shop says why it turns a request down. The buyer reads the reason, so the Shop picks or writes it;
 * the platform never writes one in its name.
 */
export function DeclineInvitationModal({
  open,
  requestCode,
  busy = false,
  onClose,
  onDecline,
}: DeclineInvitationModalProps) {
  const [choice, setChoice] = useState<string>(COMMON_REASONS[0]);
  const [otherReason, setOtherReason] = useState('');
  const [error, setError] = useState<string | undefined>();

  const isOther = choice === OTHER_REASON;

  function handleDecline() {
    const reason = isOther ? otherReason.trim() : choice;
    if (!reason) {
      setError('Vui lòng ghi lý do từ chối để khách hiểu.');
      return;
    }
    onDecline(reason);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Từ chối yêu cầu #${requestCode}`}
      description="Khách sẽ thấy lý do này. Từ chối rồi thì không gửi báo giá cho yêu cầu này được nữa."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Quay lại
          </Button>
          <Button variant="primary" onClick={handleDecline} loading={busy}>
            Từ chối yêu cầu
          </Button>
        </>
      }
    >
      <fieldset className={styles.reasons}>
        <legend className={styles.legend}>Lý do từ chối</legend>
        {COMMON_REASONS.map((reason) => (
          <Radio
            key={reason}
            name="decline-reason"
            label={reason}
            checked={choice === reason}
            onChange={() => {
              setChoice(reason);
              setError(undefined);
            }}
          />
        ))}
        <Radio
          name="decline-reason"
          label="Lý do khác"
          checked={isOther}
          onChange={() => setChoice(OTHER_REASON)}
        />
      </fieldset>
      {isOther && (
        <Textarea
          label="Lý do của Shop"
          rows={3}
          maxLength={1000}
          value={otherReason}
          onChange={(e) => {
            setOtherReason(e.target.value);
            setError(undefined);
          }}
          error={error}
        />
      )}
    </Modal>
  );
}
