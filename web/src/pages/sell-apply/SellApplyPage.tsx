import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { RequireNfc } from '../../features/nfc';
import { SellerApplyForm } from '../../features/seller-onboarding';
import { routes } from '../../shared/config/routes';

/** M7.1: needs a verified CCCD; the owner on the profile is the person on the card. */
export function SellApplyPage() {
  const navigate = useNavigate();
  const { refreshSellerStatus } = useAuth();
  return (
    <div className="shop__inner">
      <RequireNfc action="khai hồ sơ người bán">
        {(info) => (
          <SellerApplyForm
            owner={{ name: info.legalName ?? '', idMasked: info.idNumberMasked ?? '' }}
            onSubmitted={async () => {
              await refreshSellerStatus?.();
              navigate(routes.sellerChannel, { state: { submitted: true } });
            }}
          />
        )}
      </RequireNfc>
    </div>
  );
}
