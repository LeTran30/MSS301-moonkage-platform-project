import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatAddress, useAddresses } from '@/entities/address';
import { RequireNfc } from '@/entities/user';
import { useVendorStorefront } from '@/entities/vendor';
import { QuoteRequestForm } from '@/features/request-quote';
import { routes } from '@/shared/config/routes';
import { Avatar, EmptyState, KeyValue, LoadingState } from '@/shared/ui';

/** M3.4: a request to one vendor, with its own minimum. */
export function DirectRequestPage() {
  const { vendorId = '' } = useParams();
  const navigate = useNavigate();
  const vendor = useVendorStorefront(vendorId);
  const addresses = useAddresses();
  if (vendor.kind === 'loading' || addresses.kind === 'loading') return <LoadingState />;
  if (vendor.kind !== 'loaded' || !vendor.data) return <EmptyState title="Không có đơn vị này" />;
  const s = vendor.data;
  const options = addresses.kind === 'loaded' ? addresses.data.map((a) => `${a.label} – ${formatAddress(a)}`) : [];

  return (
    <div className="shop__inner">
      <RequireNfc action={`gửi yêu cầu cho ${s.shortName}`}>
        {() => (
          <QuoteRequestForm
            direct={{ id: s.id, name: s.name, shortName: s.shortName, minBoxes: s.minBoxes, boxOptions: s.boxOptions }}
            deliverOptions={options}
            onCancel={() => navigate(routes.base.vendorStorefront(s.id))}
            onSubmitted={(r) => navigate(routes.account.quoteRequest(r.id))}
            side={
              <div className="stack">
                <span className="eyebrow">Người nhận</span>
                <div className="row">
                  <Avatar initials={s.initials} />
                  <span>
                    <strong>{s.name}</strong>
                    <br />
                    <span className="muted">
                      {s.district}, {s.city}
                    </span>
                  </span>
                </div>
                <KeyValue rows={s.terms.filter((t) => t.label !== 'Công suất')} />
                <Link to={routes.base.vendorStorefront(s.id)} className="mk-btn mk-btn--text">
                  Xem trang đơn vị
                </Link>
                <p className="muted">
                  Muốn so sánh nhiều nơi? <Link to={routes.base.newQuoteRequest}>Tạo yêu cầu báo giá</Link> thay vào đó.
                </p>
              </div>
            }
          />
        )}
      </RequireNfc>
    </div>
  );
}
