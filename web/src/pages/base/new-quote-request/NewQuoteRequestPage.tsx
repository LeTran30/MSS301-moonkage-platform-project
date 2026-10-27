import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RequireNfc } from '@/entities/user';
import { matchingVendors, useVendors } from '@/entities/vendor';
import { useDeliveryArea } from '@/features/choose-delivery-area';
import { QuoteRequestForm } from '@/features/request-quote';
import { routes } from '@/shared/config/routes';

/** M3.1: one request to every vendor that matches the boxes, the custom work and the area. */
export function NewQuoteRequestPage() {
  const navigate = useNavigate();
  const { provinces, area } = useDeliveryArea();
  const vendors = useVendors();
  const [ask, setAsk] = useState({ boxes: 150, logo: true });
  const all = vendors.kind === 'loaded' ? vendors.data : [];
  const matches = matchingVendors(all, ask.boxes, ask.logo);
  const withoutLogo = matchingVendors(all, ask.boxes, false).length;
  const minAny = all.length ? Math.min(...all.map((s) => s.minBoxes)) : 0;

  return (
    <div className="shop__inner">
      <RequireNfc action="tạo yêu cầu báo giá">
        {() => (
          <QuoteRequestForm
            deliverOptions={[area, ...provinces.filter((p) => p !== area)]}
            onChange={(boxes, logo) => setAsk({ boxes, logo })}
            blocked={vendors.kind === 'loaded' && matches.length === 0 ? `Chưa có đơn vị nào nhận dưới ${minAny} hộp với yêu cầu này. Thử tăng số hộp hoặc bỏ in logo.` : null}
            onCancel={() => navigate(routes.base.customOrder)}
            onSubmitted={(r) => navigate(routes.account.quoteRequest(r.id))}
            side={
              <div className="stack">
                <span className="eyebrow">Sẽ gửi tới</span>
                <p className="match-count mk-num">{matches.length} đơn vị</p>
                <p className="muted">khớp số hộp, kiểu làm riêng và vùng giao bạn chọn.</p>
                {matches.length === 0 && ask.logo && withoutLogo > 0 && <p className="muted">Bỏ in logo: {withoutLogo} đơn vị</p>}
                <ul className="cond-list">
                  {matches.map((s) => (
                    <li key={s.id}>
                      {s.name} · từ {s.minBoxes} hộp
                    </li>
                  ))}
                </ul>
                <p className="notice">Theo dõi báo giá ở Yêu cầu và báo giá. Bạn chưa phải trả tiền cho tới khi chấp nhận một báo giá.</p>
              </div>
            }
          />
        )}
      </RequireNfc>
      <p className="muted page-foot">
        Đã biết đơn vị muốn đặt? <Link to={routes.base.vendorDirectory}>Chọn đơn vị cung cấp</Link>.
      </p>
    </div>
  );
}
