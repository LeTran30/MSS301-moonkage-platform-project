import { ProfileView } from '../../features/auth';
import { useNfcStatus } from '../../features/nfc';
import { formatDateTime } from '../../shared/utils/format';
import { LoadingState, PageHeader } from '../../shared/ui';

/** M6.5 */
export function ProfilePage() {
  const { status } = useNfcStatus();
  if (status.kind === 'loading') return <LoadingState />;
  const info = status.kind === 'loaded' && status.info.nfcStatus === 'VERIFIED' ? status.info : null;
  return (
    <div className="stack-lg">
      <PageHeader title="Thông tin cá nhân" />
      <ProfileView
        identity={
          info
            ? { name: info.legalName ?? '', idMasked: info.idNumberMasked ?? '', verifiedAt: info.nfcVerifiedAt ? formatDateTime(info.nfcVerifiedAt).split(' ')[1] : '' }
            : null
        }
      />
    </div>
  );
}
