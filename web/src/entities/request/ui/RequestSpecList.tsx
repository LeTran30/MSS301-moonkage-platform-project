import { formatCurrency, formatDate } from '@/shared/utils';
import { CUSTOM_TYPE_LABELS, type QuoteRequest } from '../model/requestStore';
import styles from './RequestSpecList.module.css';

/** The parts the request form joins into `customSpec` (free text, "Vỏ: …", "Nhân: …"). */
const SPEC_PART_SEPARATOR = ' | ';

type Props = {
  request: QuoteRequest;
  /** Shows the delivery address; off where the page already shows it. */
  withDelivery?: boolean;
};

/**
 * What the buyer asked for in a quote request (FR-13, BR-14): quantity, deadline, custom work and notes.
 *
 * The buyer sees it again next to the quotes, and the Shop sees it on the order the request became, so both read
 * the same specification.
 */
export function RequestSpecList({ request, withDelivery = false }: Props) {
  const specParts = (request.customRequirements ?? '')
    .split(SPEC_PART_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
  const customTypes = request.customTypes ?? [];

  return (
    <dl className={styles.list}>
      <div className={styles.row}>
        <dt>Số lượng</dt>
        <dd>{request.quantity} hộp</dd>
      </div>
      <div className={styles.row}>
        <dt>Hạn nhận bánh</dt>
        <dd>{request.deliveryDeadline ? formatDate(request.deliveryDeadline) : '—'}</dd>
      </div>
      <div className={styles.row}>
        <dt>Tùy chỉnh</dt>
        <dd>{customTypes.length > 0 ? customTypes.map((t) => CUSTOM_TYPE_LABELS[t]).join(', ') : 'Không có'}</dd>
      </div>
      {request.budgetPerBox ? (
        <div className={styles.row}>
          <dt>Ngân sách</dt>
          <dd>{formatCurrency(request.budgetPerBox)} / hộp</dd>
        </div>
      ) : null}
      {request.customLogoFileName && (
        <div className={styles.row}>
          <dt>Logo</dt>
          <dd>{request.customLogoFileName}</dd>
        </div>
      )}
      {withDelivery && (
        <div className={styles.row}>
          <dt>Giao tới</dt>
          <dd>{[request.deliveryAddress, request.deliveryProvince].filter(Boolean).join(', ')}</dd>
        </div>
      )}
      <div className={styles.row}>
        <dt>Yêu cầu riêng</dt>
        <dd>
          {specParts.length > 0
            ? specParts.map((part) => (
                <span key={part} className={styles.part}>
                  {part}
                </span>
              ))
            : 'Không có'}
        </dd>
      </div>
    </dl>
  );
}
