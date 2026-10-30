import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { formatCountdown } from '@/shared/utils/format';
import { nfcQrPayload } from '../model/qrPayload';
import type { NfcSessionPhase } from '../model/useNfcSession';
import { nfcStrings } from '../strings';
import styles from './NfcQrPanel.module.css';

const QR_WIDTH_PX = 240;
const QR_MARGIN_MODULES = 2;

/** QR colours come from the light theme tokens on the plate: phone scanners read dark-on-light reliably. */
function plateColors(plate: HTMLElement) {
  const style = getComputedStyle(plate);
  return {
    dark: style.getPropertyValue('--ink').trim(),
    light: style.getPropertyValue('--surface').trim(),
  };
}

function QrImage({ sessionId }: { sessionId: string }) {
  const plateRef = useRef<HTMLDivElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const plate = plateRef.current;
    if (!plate) return;
    let cancelled = false;
    QRCode.toDataURL(nfcQrPayload(sessionId), {
      width: QR_WIDTH_PX,
      margin: QR_MARGIN_MODULES,
      errorCorrectionLevel: 'M',
      color: plateColors(plate),
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div ref={plateRef} className={`${styles.qr} nfc-qr`} data-theme="light">
      {dataUrl && <img src={dataUrl} alt={nfcStrings.qrAlt} width={QR_WIDTH_PX} height={QR_WIDTH_PX} />}
    </div>
  );
}

function reasonText(reasonCode: string | null): string {
  return (reasonCode && nfcStrings.reasons[reasonCode]) || nfcStrings.reasons.other;
}

interface NfcQrPanelProps {
  phase: NfcSessionPhase;
  onCreate: () => void;
}

/** The QR step of FR-04 for an account that is not verified yet. */
export function NfcQrPanel({ phase, onCreate }: NfcQrPanelProps) {
  const creating = phase.kind === 'creating';
  const createLabel = phase.kind === 'idle' || creating ? nfcStrings.createQr : nfcStrings.newQr;

  return (
    <section className={`panel ${styles.panel} nfc-panel`} aria-labelledby="nfc-qr-heading">
      <div className={`${styles.steps} nfc-panel__steps`}>
        <h2 id="nfc-qr-heading" className="heading-text">
          {nfcStrings.qrHeading}
        </h2>
        <ol className="steps">
          {nfcStrings.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className={`${styles.qrContainer} nfc-panel__qr`}>
        {phase.kind === 'pending' ? (
          <>
            <QrImage sessionId={phase.session.sessionId} />
            <p className="mk-badge mk-badge--muted" role="status">
              {nfcStrings.waiting}
            </p>
            <p className="muted mk-num">{nfcStrings.remaining(formatCountdown(phase.secondsLeft))}</p>
            {phase.lastRejection ? (
              <p role="alert" className={`error-text ${styles.rejection} nfc-panel__rejection`}>
                {nfcStrings.rejected(reasonText(phase.lastRejection.reasonCode), phase.lastRejection.attemptsLeft)}
              </p>
            ) : (
              <p className="muted">{nfcStrings.autoUpdate}</p>
            )}
          </>
        ) : (
          <div className={`${styles.qr} ${styles.qrEmpty} nfc-qr nfc-qr--empty`}>
            {(phase.kind === 'idle' || phase.kind === 'creating') && <p className="muted">{nfcStrings.qrPlaceholder}</p>}
            {phase.kind === 'expired' && (
              <p role="status">{phase.reason === 'timeout' ? nfcStrings.expired : nfcStrings.sessionLost}</p>
            )}
            {phase.kind === 'error' && (
              <p role="alert" className="error-text">
                {phase.error.message}
              </p>
            )}
          </div>
        )}

        {phase.kind !== 'verified' && (
          <button
            type="button"
            className={`mk-btn ${phase.kind === 'pending' ? 'mk-btn--quiet' : 'mk-btn--primary'}`}
            onClick={onCreate}
            disabled={creating}
            aria-busy={creating || undefined}
          >
            {creating ? nfcStrings.creatingQr : createLabel}
          </button>
        )}
      </div>
    </section>
  );
}
