import { formatDateTime } from '@/shared/utils/format';
import type { NfcStatusInfo } from '../model/nfcStatus';
import { nfcStatusStrings } from '../nfcStrings';

/** A verified account: masked data only (AC-04.12). */
export function NfcVerifiedCard({ info }: { info: NfcStatusInfo }) {
  return (
    <section className="panel" aria-labelledby="nfc-verified-heading">
      <p className="mk-badge mk-badge--ok">{nfcStatusStrings.verifiedBadge}</p>
      <h2 id="nfc-verified-heading" className="heading-text">
        {nfcStatusStrings.verifiedTitle}
      </h2>
      <dl className="facts">
        <dt>{nfcStatusStrings.legalName}</dt>
        <dd>{info.legalName}</dd>
        <dt>{nfcStatusStrings.idNumber}</dt>
        <dd className="mk-num">{info.idNumberMasked}</dd>
        {info.nfcVerifiedAt && (
          <>
            <dt>{nfcStatusStrings.verifiedAt}</dt>
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
      <p className="mk-badge mk-badge--warn">{nfcStatusStrings.lockedBadge}</p>
      <h2 id="nfc-locked-heading" className="heading-text">
        {nfcStatusStrings.lockedTitle}
      </h2>
      <p>{message ?? nfcStatusStrings.lockedBody}</p>
      <button type="button" className="mk-btn mk-btn--quiet" onClick={onReload}>
        {nfcStatusStrings.reloadStatus}
      </button>
    </section>
  );
}
