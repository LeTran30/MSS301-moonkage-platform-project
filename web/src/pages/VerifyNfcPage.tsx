import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getMyNfcStatus, NfcErrorCode, type NfcStatusInfo } from '../api/nfc';
import { NfcQrPanel } from '../features/nfc/NfcQrPanel';
import { NfcLockedCard, NfcVerifiedCard } from '../features/nfc/NfcStatusCard';
import { useNfcSession } from '../features/nfc/useNfcSession';
import { strings } from '../strings';
import { formatDateTime } from '../utils/format';

type StatusState =
  | { kind: 'loading' }
  | { kind: 'loaded'; info: NfcStatusInfo }
  | { kind: 'error'; message: string };

async function loadStatusState(): Promise<StatusState> {
  try {
    return { kind: 'loaded', info: await getMyNfcStatus() };
  } catch (error) {
    return { kind: 'error', message: error instanceof ApiError ? error.message : strings.errors.server };
  }
}

/** FR-04 on the web (route /account/verify-nfc): shows the account's NFC status, or the QR for the app. */
export function VerifyNfcPage() {
  const [status, setStatus] = useState<StatusState>({ kind: 'loading' });

  /** Sets the state only when the answer arrives; showing "loading" again is up to the caller. */
  const fetchStatus = useCallback(async () => setStatus(await loadStatusState()), []);

  useEffect(() => {
    let cancelled = false;
    void loadStatusState().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { phase, start, reset } = useNfcSession(fetchStatus);

  const reload = () => {
    reset();
    setStatus({ kind: 'loading' });
    void fetchStatus();
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
        ? strings.nfc.lockedUntil(formatDateTime(phase.lockedUntil))
        : phase.kind === 'locked'
          ? strings.nfc.lockedBody
          : null;
  const locked = lockedMessage !== null;

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="title-text">{strings.nfc.title}</h1>
        <p className="muted">{strings.nfc.intro}</p>
      </header>

      {status.kind === 'loading' && <p role="status">{strings.nfc.loadingStatus}</p>}

      {status.kind === 'error' && (
        <div className="panel">
          <p role="alert" className="error-text">
            {status.message}
          </p>
          <button type="button" className="mk-btn mk-btn--quiet" onClick={reload}>
            {strings.nfc.reloadStatus}
          </button>
        </div>
      )}

      {status.kind === 'loaded' && status.info.nfcStatus === 'VERIFIED' && <NfcVerifiedCard info={status.info} />}

      {status.kind === 'loaded' && (status.info.nfcStatus === 'LOCKED' || locked) && (
        <NfcLockedCard message={lockedMessage ?? undefined} onReload={reload} />
      )}

      {status.kind === 'loaded' && status.info.nfcStatus === 'NOT_VERIFIED' && !locked && (
        <NfcQrPanel phase={phase} onCreate={() => void createQr()} />
      )}
    </div>
  );
}
