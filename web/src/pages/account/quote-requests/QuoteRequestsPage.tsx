import { Link } from 'react-router-dom';
import { RequestList } from '@/entities/quote';
import { routes } from '@/shared/config/routes';
import { PageHeader } from '@/shared/ui';

/** M6.2 */
export function QuoteRequestsPage() {
  return (
    <div className="stack-lg">
      <PageHeader
        title="Yêu cầu và báo giá"
        actions={
          <Link to={routes.base.newQuoteRequest} className="mk-btn mk-btn--primary">
            Tạo yêu cầu báo giá
          </Link>
        }
      />
      <RequestList />
    </div>
  );
}
