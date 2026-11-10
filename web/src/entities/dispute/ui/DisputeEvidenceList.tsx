import { formatDateTime } from '@/shared/utils';
import type { DisputeEvidence, DisputeParty } from '../model/dispute';
import styles from './DisputeEvidenceList.module.css';

interface DisputeEvidenceListProps {
  evidences: DisputeEvidence[];
  /** Chỉ hiện bằng chứng của một bên; bỏ trống thì hiện cả hai. */
  party?: DisputeParty;
  /** Câu hiện khi bên đó chưa gửi bằng chứng nào. */
  emptyText?: string;
}

/**
 * Bằng chứng của một hồ sơ khiếu nại (AC-49.1): ảnh thu nhỏ mở bản gốc ở tab
 * mới, kèm ghi chú và thời điểm gửi.
 */
export function DisputeEvidenceList({ evidences, party, emptyText }: DisputeEvidenceListProps) {
  const shown = party ? evidences.filter((e) => e.party === party) : evidences;
  if (shown.length === 0) {
    return emptyText ? <p className={styles.empty}>{emptyText}</p> : null;
  }
  return (
    <ul className={styles.list}>
      {shown.map((evidence, index) => (
        <li key={`${evidence.party}-${index}`} className={styles.item}>
          <a
            href={evidence.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Mở ảnh bằng chứng ${index + 1} cỡ lớn`}
          >
            <img
              src={evidence.downloadUrl}
              alt=""
              className={styles.thumb}
              loading="lazy"
              decoding="async"
            />
          </a>
          <div className={styles.meta}>
            {evidence.note && <span className={styles.note}>{evidence.note}</span>}
            {evidence.createdAt && (
              <span className={styles.time}>{formatDateTime(evidence.createdAt)}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
