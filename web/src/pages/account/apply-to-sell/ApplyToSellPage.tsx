import { useNavigate } from 'react-router-dom';
import { useSession } from '@/entities/user';
import { RequireNfc } from '@/entities/user';
import { VendorApplyForm } from '@/features/apply-to-sell';
import { routes } from '@/shared/config/routes';

/** M7.1: needs a verified CCCD; the owner on the profile is the person on the card. */
export function ApplyToSellPage() {
  const navigate = useNavigate();
  const { refreshVendorStatus } = useSession();
  return (
    <div className="shop__inner">
      <RequireNfc action="khai hồ sơ người bán">
        {(info) => (
          <VendorApplyForm
            owner={{ name: info.legalName ?? '', idMasked: info.idNumberMasked ?? '' }}
            onSubmitted={async () => {
              await refreshVendorStatus?.();
              navigate(routes.vendor.overview, { state: { submitted: true } });
            }}
          />
        )}
      </RequireNfc>
    </div>
  );
}
