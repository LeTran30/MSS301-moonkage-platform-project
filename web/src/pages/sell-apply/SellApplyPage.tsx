import { useNavigate } from 'react-router-dom';
import { RequireNfc } from '../../features/nfc';
import { SellerApplyForm } from '../../features/seller-onboarding';
import { routes } from '../../shared/config/routes';

/** M7.1: needs a verified CCCD; the owner on the profile is the person on the card. */
export function SellApplyPage() {
  const navigate = useNavigate();
  return (
    <div className="shop__inner">
      <RequireNfc action="khai hồ sơ người bán">
        {(info) => (
          <SellerApplyForm
            owner={{ name: info.legalName ?? '', idMasked: info.idNumberMasked ?? '' }}
            onSubmitted={() => navigate(routes.sellerChannel, { state: { submitted: true } })}
          />
        )}
      </RequireNfc>
    </div>
  );
}
