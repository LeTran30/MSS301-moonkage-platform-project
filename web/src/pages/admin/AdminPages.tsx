import { useParams } from 'react-router-dom';
import {
  AdminMoneyHub,
  AdminOverview,
  AdminProducts,
  ApplicationReview,
  ConfigHub,
  DisbursementApprovals,
  DisputeDecision,
  DisputeList,
  Payouts,
  ProvinceFees,
  ReconciliationView,
  SellerApplications,
  SellerFeeConfig,
  TaxonomyConfig,
  useApplication,
  useDispute,
  VoucherDeferred,
} from '../../features/admin';
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui';

export const AdminOverviewPage = () => <AdminOverview />;
export const AdminSellersPage = () => <SellerApplications />;

export function AdminSellerPage() {
  const { applicationId = '' } = useParams();
  const state = useApplication(applicationId);
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  if (!state.data) return <EmptyState title="Không tìm thấy hồ sơ" />;
  return <ApplicationReview key={state.data.history.length} app={state.data} onChanged={state.reload} />;
}

export const AdminProductsPage = () => <AdminProducts />;
export const AdminMoneyPage = () => <AdminMoneyHub />;
export const AdminDisbursementsPage = () => <DisbursementApprovals />;
export const AdminPayoutsPage = () => <Payouts />;
export const AdminReconciliationPage = () => <ReconciliationView />;
export const AdminDisputesPage = () => <DisputeList />;

export function AdminDisputePage() {
  const { disputeId = '' } = useParams();
  const state = useDispute(disputeId);
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  if (!state.data) return <EmptyState title="Không tìm thấy khiếu nại" />;
  return <DisputeDecision key={state.data.state} dispute={state.data} onChanged={state.reload} />;
}

export const AdminConfigPage = () => <ConfigHub />;
export const AdminProvinceFeesPage = () => <ProvinceFees />;
export const AdminSellerFeePage = () => <SellerFeeConfig />;
export const AdminVouchersPage = () => <VoucherDeferred />;
export const AdminTaxonomyPage = () => <TaxonomyConfig />;
