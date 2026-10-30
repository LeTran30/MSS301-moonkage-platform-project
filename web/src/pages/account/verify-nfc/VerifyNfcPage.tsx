import { Link, useSearchParams } from 'react-router-dom';
import { NfcLockedCard, nfcStatusStrings, NfcVerifiedCard, useNfcStatus } from '@/entities/user';
import { NfcErrorCode, NfcQrPanel, nfcStrings, useNfcSession } from '@/features/verify-nfc';
import { formatDateTime } from '@/shared/utils/format';

/** FR-04 on the web (route /account/verify-nfc): shows the account's NFC status, or the QR for the app. */
export function VerifyNfcPage() {
  // where the user was going when the NFC gate sent them here (RequireNfc)
  const next = useSearchParams()[0].get('next');
  const { status, refresh, reload: reloadStatus } = useNfcStatus();
  const { phase, start, reset } = useNfcSession(refresh);

  const reload = () => {
    reset();
    reloadStatus();
  };

  const createQr = async () => {
    const error = await start();
    // verified meanwhile (another tab): show the verified card instead of the error
    if (error?.code === NfcErrorCode.alreadyVerified) reload();
  };

  const startError = phase.kind === 'error' ? phase.error : null;
  // locked either when asking for a QR (429, the server's message) or by the push after a refused card
  const lockedMessage =
    startError?.code === NfcErrorCode.locked
      ? startError.message
      : phase.kind === 'locked' && phase.lockedUntil
        ? nfcStrings.lockedUntil(formatDateTime(phase.lockedUntil))
        : phase.kind === 'locked'
          ? nfcStatusStrings.lockedBody
          : null;
  const locked = lockedMessage !== null;

  return (
    <div className="stack-lg">
      <header className="page__head">
        <h1 className="title-text">{nfcStrings.title}</h1>
        <p className="muted">{nfcStrings.intro}</p>
      </header>

      {status.kind === 'loading' && <p role="status">{nfcStrings.loadingStatus}</p>}

      {status.kind === 'error' && (
        <div className="panel">
          <p role="alert" className="error-text">
            {status.message}
          </p>
          <button type="button" className="mk-btn mk-btn--quiet" onClick={reload}>
            {nfcStatusStrings.reloadStatus}
          </button>
        </div>
      )}

      {status.kind === 'loaded' && status.info.nfcStatus === 'VERIFIED' && (
        <>
          <NfcVerifiedCard info={status.info} />
          {next?.startsWith('/') && (
            <Link to={next} className="mk-btn mk-btn--primary">
              Tiếp tục việc đang làm
            </Link>
          )}
        </>
      )}

      {status.kind === 'loaded' && (status.info.nfcStatus === 'LOCKED' || locked) && (
        <NfcLockedCard message={lockedMessage ?? undefined} onReload={reload} />
      )}

      {status.kind === 'loaded' && status.info.nfcStatus === 'NOT_VERIFIED' && !locked && (
        <NfcQrPanel phase={phase} onCreate={() => void createQr()} />
      )}
    </div>
  );
}
