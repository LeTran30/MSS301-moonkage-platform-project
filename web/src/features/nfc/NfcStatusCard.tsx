import type { NfcStatusInfo } from '../../api/nfc';
import { strings } from '../../strings';
import { formatDateTime } from '../../utils/format';

/** A verified account: masked data only (AC-04.12). */
export function NfcVerifiedCard({ info }: { info: NfcStatusInfo }) {
  return (
    <section className="panel" aria-labelledby="nfc-verified-heading">
      <p className="mk-badge mk-badge--ok">{strings.nfc.verifiedBadge}</p>
      <h2 id="nfc-verified-heading" className="heading-text">
        {strings.nfc.verifiedTitle}
      </h2>
      <dl className="facts">
        <dt>{strings.nfc.legalName}</dt>
        <dd>{info.legalName}</dd>
        <dt>{strings.nfc.idNumber}</dt>
        <dd className="mk-num">{info.idNumberMasked}</dd>
        {info.nfcVerifiedAt && (
          <>
            <dt>{strings.nfc.verifiedAt}</dt>
            <dd className="mk-num">{formatDateTime(info.nfcVerifiedAt)}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

/** Verification is locked after too many invalid cards (AC-04.9); the server message names the minutes left. */
export function NfcLockedCard({ message, onReload }: { message?: string; onReload: () => void }) {
  return (
    <section className="panel" aria-labelledby="nfc-locked-heading">
      <p className="mk-badge mk-badge--warn">{strings.nfc.lockedBadge}</p>
      <h2 id="nfc-locked-heading" className="heading-text">
        {strings.nfc.lockedTitle}
      </h2>
      <p>{message ?? strings.nfc.lockedBody}</p>
      <button type="button" className="mk-btn mk-btn--quiet" onClick={onReload}>
        {strings.nfc.reloadStatus}
      </button>
    </section>
  );
}
