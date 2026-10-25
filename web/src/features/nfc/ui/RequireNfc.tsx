import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { ErrorState, LoadingState } from '../../../shared/ui';
import type { NfcStatusInfo } from '../api/nfc';
import { useNfcStatus } from '../model/useNfcStatus';

/**
 * Gate of the actions that need a verified CCCD (BR-23): quote requests, seller profile. Shows the content with the
 * verified identity, or a box sending the user to verify and back here.
 */
export function RequireNfc({ children, action }: { children: (info: NfcStatusInfo) => ReactNode; action: string }) {
  const { status, reload } = useNfcStatus();
  const location = useLocation();
  if (status.kind === 'loading') return <LoadingState />;
  if (status.kind === 'error') return <ErrorState message={status.message} onRetry={reload} />;
  if (status.info.nfcStatus === 'VERIFIED') return <>{children(status.info)}</>;
  return (
    <div className="page page--narrow">
      <section className="panel panel--wide gate" aria-labelledby="gate-heading">
        <span className="eyebrow">Cần xác minh danh tính</span>
        <h1 id="gate-heading" className="title-text">
          Xác minh CCCD trước khi {action}
        </h1>
        <p>
          Thao tác này cần xác minh danh tính bằng CCCD gắn chip, một lần cho tài khoản. Xác minh xong bạn quay lại đúng trang này.
        </p>
        <Link to={`${routes.verifyNfc}?next=${encodeURIComponent(location.pathname)}`} className="mk-btn mk-btn--primary">
          Đi tới Xác minh danh tính
        </Link>
      </section>
    </div>
  );
}
