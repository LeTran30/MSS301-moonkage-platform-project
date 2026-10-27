import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { demoStore } from '../../../shared/api/demo';
import {
  cakeAttributesApi,
  interprovinceFeesApi,
  registrationFeeConfigApi,
  vendorsApi,
} from '../../../shared/api/gateway';
import { mockResponse, seedStore } from '../../../shared/api/mock';
import { config } from '../../../shared/config/env';
import { PROVINCE_ITEMS, provinceCodeOf, provinceNameOf } from '../../../shared/config/provinces';
import {
  seedAdminProducts,
  seedApplications,
  seedDisbursementRequests,
  seedDisputes,
  seedPayouts,
  seedProvinceFees,
  seedReconciliation,
  seedTaxonomy,
} from './seed';
import type {
  AdminProduct,
  ApplicationState,
  DisbursementRequest,
  Dispute,
  ProvinceFee,
  SellerApplication,
  Taxonomy,
} from './types';

/** Admin area: connects to vendor-service and catalog-service in real API mode, and uses seedStore in demo mode. */
const applications = seedStore('admin-applications', seedApplications);
const products = seedStore('admin-products', seedAdminProducts);
const disbursements = seedStore('admin-disbursements', seedDisbursementRequests);
const payouts = seedStore('admin-payouts', seedPayouts);
const disputes = seedStore('admin-disputes', seedDisputes);
const fees = seedStore('admin-province-fees', seedProvinceFees);
const sellerFee = seedStore('admin-seller-fee', 200000);
const taxonomy = seedStore('admin-taxonomy', seedTaxonomy);

const today = () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : today();

interface VendorSummaryDto {
  id: string;
  ownerAccountId: string;
  businessName: string;
  status: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  supplySource: 'SELF_PRODUCED' | 'RESELL' | 'BOTH';
  sellsShop: boolean;
  acceptsOrders: boolean;
}

interface OwnerCheckDto {
  submissionNo: number;
  ownerLegalName: string;
  ownerIdMasked: string;
  nfcVerifiedAt: string;
  idMatch: boolean;
  nameMatch: 'EXACT' | 'DIACRITIC_ONLY' | 'MISMATCH';
  checkedAt: string;
}

interface VendorDetailDto {
  id: string;
  ownerAccountId: string;
  businessName: string;
  entityType: 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP';
  taxCode: string;
  address: string;
  provinceCode: string;
  representativeName: string;
  representativeIdMasked: string;
  supplySource: 'SELF_PRODUCED' | 'RESELL' | 'BOTH';
  sellsShop: boolean;
  acceptsOrders: boolean;
  status: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  statusReason: string | null;
  ownerCheck: OwnerCheckDto | null;
  createdAt: string;
  updatedAt: string;
}

interface VendorReviewDto {
  id: string;
  adminAccountId: string;
  decision: 'APPROVE' | 'NEEDS_INFO' | 'REJECT';
  reason: string | null;
  decidedAt: string;
}

function mapVendorStatusToApplicationState(status: VendorDetailDto['status']): ApplicationState {
  if (status === 'APPROVED') return 'approved';
  if (status === 'NEEDS_INFO') return 'needs-more';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'LOCKED') return 'locked';
  return 'pending';
}

function mapVendorDetailToApplication(detail: VendorDetailDto, reviews: VendorReviewDto[]): SellerApplication {
  const ways: string[] = [];
  if (detail.sellsShop) ways.push('Shop');
  if (detail.acceptsOrders) ways.push('Nhận đặt hàng');

  const check = detail.ownerCheck;
  const chipName = check
    ? check.nameMatch === 'MISMATCH'
      ? check.ownerLegalName
      : detail.representativeName
    : detail.representativeName;
  const chipId = check
    ? check.idMatch
      ? detail.representativeIdMasked
      : `${check.ownerIdMasked} (lệch)`
    : detail.representativeIdMasked;

  const history = [
    ...reviews.map((r) => ({
      label:
        r.decision === 'APPROVE'
          ? 'Quản trị duyệt hồ sơ'
          : r.decision === 'NEEDS_INFO'
            ? `Quản trị yêu cầu bổ sung: ${r.reason ?? ''}`
            : `Quản trị từ chối hồ sơ: ${r.reason ?? ''}`,
      at: formatDate(r.decidedAt),
    })),
    { label: 'Người bán nộp hồ sơ', at: formatDate(detail.createdAt) },
  ];

  return {
    id: detail.id,
    account: detail.ownerAccountId,
    shopName: detail.businessName,
    kind: detail.entityType === 'SOLE_PROPRIETORSHIP' ? 'Doanh nghiệp tư nhân' : 'Hộ kinh doanh',
    city: provinceNameOf(detail.provinceCode),
    ways: ways.join(', ') || 'Shop',
    attempt: check?.submissionNo ?? 1,
    submittedAt: formatDate(detail.createdAt),
    waiting: detail.status === 'PENDING' ? 'Chờ duyệt' : '',
    regNo: detail.taxCode,
    address: `${detail.address}, ${provinceNameOf(detail.provinceCode)}`,
    source: detail.supplySource === 'RESELL' ? 'Bán lại hàng của đơn vị khác' : 'Tự sản xuất',
    ownerOnPaper: { name: detail.representativeName, id: detail.representativeIdMasked },
    ownerOnChip: { name: chipName, id: chipId },
    state: mapVendorStatusToApplicationState(detail.status),
    history,
  };
}

export async function fetchApplications(): Promise<SellerApplication[]> {
  if (config.demoMode) return mockResponse(applications.get());
  const listRes = await apiClient.get<ApiResponse<VendorSummaryDto[]>>(vendorsApi);
  const summaries = listRes.data.data ?? [];
  const details = await Promise.all(
    summaries.map(async (s) => {
      const [detailRes, reviewsRes] = await Promise.all([
        apiClient.get<ApiResponse<VendorDetailDto>>(`${vendorsApi}/${encodeURIComponent(s.id)}`),
        apiClient
          .get<ApiResponse<VendorReviewDto[]>>(`${vendorsApi}/${encodeURIComponent(s.id)}/reviews`)
          .catch(() => ({ data: { data: [] as VendorReviewDto[] } })),
      ]);
      return mapVendorDetailToApplication(detailRes.data.data, reviewsRes.data.data ?? []);
    }),
  );
  return details;
}

export async function fetchApplication(id: string): Promise<SellerApplication | null> {
  if (!id) return null;
  if (config.demoMode) return mockResponse(applications.get().find((a) => a.id === id) ?? null);
  try {
    const [detailRes, reviewsRes] = await Promise.all([
      apiClient.get<ApiResponse<VendorDetailDto>>(`${vendorsApi}/${encodeURIComponent(id)}`),
      apiClient
        .get<ApiResponse<VendorReviewDto[]>>(`${vendorsApi}/${encodeURIComponent(id)}/reviews`)
        .catch(() => ({ data: { data: [] as VendorReviewDto[] } })),
    ]);
    return mapVendorDetailToApplication(detailRes.data.data, reviewsRes.data.data ?? []);
  } catch {
    return null;
  }
}

/**
 * Decide on a seller profile.
 */
export async function decideApplication(
  id: string,
  state: ApplicationState,
  note?: string,
): Promise<SellerApplication | null> {
  if (config.demoMode) {
    const labels: Record<ApplicationState, string> = {
      approved: 'Quản trị duyệt hồ sơ',
      'needs-more': `Quản trị yêu cầu bổ sung: ${note ?? ''}`,
      rejected: `Quản trị từ chối hồ sơ: ${note ?? ''}`,
      locked: 'Quản trị khóa người bán',
      pending: 'Chờ duyệt',
    };
    const next = applications.update((list) =>
      list.map((a) => (a.id === id ? { ...a, state, history: [{ label: labels[state], at: today() }, ...a.history] } : a)),
    );
    const app = next.find((a) => a.id === id) ?? null;
    if (app?.account) {
      const sellerState = state === 'approved' ? 'approved' : state === 'locked' ? 'rejected' : state;
      demoStore.set(`seller-state:${app.account}`, {
        state: sellerState,
        moreNeeded: note,
        approvedAt: state === 'approved' ? today() : undefined,
      });
    }
    return mockResponse(app);
  }

  if (state === 'locked') {
    await apiClient.patch(`${vendorsApi}/${encodeURIComponent(id)}`, {
      status: 'LOCKED',
      statusReason: note || 'Khóa bởi quản trị',
    });
  } else {
    const decision = state === 'approved' ? 'APPROVE' : state === 'needs-more' ? 'NEEDS_INFO' : 'REJECT';
    await apiClient.post(`${vendorsApi}/${encodeURIComponent(id)}/reviews`, {
      decision,
      reason: note || undefined,
      licenseChecked: true,
      registryChecked: true,
    });
  }
  return fetchApplication(id);
}

interface AdminProductDto {
  id: string;
  vendorId: string;
  name: string;
  listPrice: number;
  status: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  removedReason: string | null;
  updatedAt: string;
}

const productVendorMap = new Map<string, string>();

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (config.demoMode) return mockResponse(products.get());
  const vendorsRes = await apiClient.get<ApiResponse<VendorSummaryDto[]>>(vendorsApi);
  const vendors = vendorsRes.data.data ?? [];
  const allProducts = await Promise.all(
    vendors.map(async (v) => {
      try {
        const res = await apiClient.get<ApiResponse<AdminProductDto[]>>(
          `${vendorsApi}/${encodeURIComponent(v.id)}/products`,
        );
        return (res.data.data ?? []).map((p): AdminProduct => {
          productVendorMap.set(p.id, v.id);
          return {
            id: p.id,
            name: p.name,
            shop: v.businessName,
            price: p.listPrice,
            removed:
              p.status === 'REMOVED'
                ? { reason: p.removedReason || 'Vi phạm chính sách', at: formatDate(p.updatedAt) }
                : undefined,
          };
        });
      } catch {
        return [] as AdminProduct[];
      }
    }),
  );
  return allProducts.flat();
}

export async function takeDownProduct(id: string, reason: string): Promise<boolean> {
  if (config.demoMode) {
    products.update((list) => list.map((p) => (p.id === id ? { ...p, removed: { reason, at: today() } } : p)));
    return mockResponse(true);
  }
  let vendorId = productVendorMap.get(id);
  if (!vendorId) {
    await fetchAdminProducts();
    vendorId = productVendorMap.get(id);
  }
  if (!vendorId) return false;
  await apiClient.patch(`${vendorsApi}/${encodeURIComponent(vendorId)}/products/${encodeURIComponent(id)}`, {
    status: 'REMOVED',
    removedReason: reason.trim(),
  });
  return true;
}

export const fetchDisbursementRequests = () => mockResponse(disbursements.get());
export function decideDisbursement(id: string, approve: boolean, refusal?: string): Promise<DisbursementRequest[]> {
  return mockResponse(disbursements.update((list) => list.map((d) => (d.id === id ? { ...d, state: approve ? 'approved' : 'refused', refusal } : d))));
}

export const fetchPayouts = () => mockResponse(payouts.get());
export function payOut(orderIds: string[]) {
  payouts.update((list) => list.map((p) => (orderIds.includes(p.orderId) ? { ...p, paid: true } : p)));
  return mockResponse(true);
}

export const fetchReconciliation = () => mockResponse(seedReconciliation);

export const fetchDisputes = () => mockResponse(disputes.get());
export const fetchDispute = (id: string) => mockResponse(disputes.get().find((d) => d.id === id) ?? null);
export function decideDispute(id: string, kind: string, amount: number, note: string): Promise<Dispute | null> {
  const next = disputes.update((list) =>
    list.map((d) =>
      d.id === id
        ? { ...d, state: 'decided', decision: { kind, amount, note, at: today() }, history: [{ label: 'Quản trị quyết định', at: today() }, ...d.history] }
        : d,
    ),
  );
  return mockResponse(next.find((d) => d.id === id) ?? null);
}

interface InterprovinceFeeTableDto {
  fees: { provinceCode: string; provinceName: string; fee: number | null }[];
  complete: boolean;
}

export async function fetchProvinceFees(): Promise<ProvinceFee[]> {
  if (config.demoMode) return mockResponse(fees.get());
  const res = await apiClient.get<ApiResponse<InterprovinceFeeTableDto>>(interprovinceFeesApi);
  const rows = res.data.data?.fees ?? [];
  if (rows.length > 0) {
    return rows.map((f) => ({ province: provinceNameOf(f.provinceCode), fee: f.fee }));
  }
  return PROVINCE_ITEMS.map((p) => ({ province: p.name, fee: null }));
}

export async function saveProvinceFees(next: ProvinceFee[]): Promise<boolean> {
  if (config.demoMode) {
    fees.update(() => next);
    return mockResponse(true);
  }
  const payload = {
    fees: next
      .filter((f): f is { province: string; fee: number } => f.fee !== null)
      .map((f) => ({ provinceCode: provinceCodeOf(f.province), fee: f.fee })),
  };
  await apiClient.put(interprovinceFeesApi, payload);
  return true;
}

interface RegistrationFeeConfigDto {
  amount: number;
  effectiveFrom: string;
}

export async function fetchSellerFee(): Promise<number> {
  if (config.demoMode) return mockResponse(sellerFee.get());
  const res = await apiClient.get<ApiResponse<RegistrationFeeConfigDto>>(registrationFeeConfigApi);
  return res.data.data?.amount ?? 200000;
}

export async function saveSellerFee(amount: number): Promise<boolean> {
  if (config.demoMode) {
    sellerFee.update(() => amount);
    return mockResponse(true);
  }
  await apiClient.put(registrationFeeConfigApi, { amount });
  return true;
}

interface CakeAttributeDto {
  id: string;
  group: 'CRUST' | 'FILLING';
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

export async function fetchTaxonomy(): Promise<Taxonomy> {
  if (config.demoMode) return mockResponse(taxonomy.get());
  const res = await apiClient.get<ApiResponse<CakeAttributeDto[]>>(cakeAttributesApi, {
    params: { includeHidden: true },
  });
  const list = res.data.data ?? [];
  return {
    crusts: list.filter((a) => a.group === 'CRUST').map((a) => ({ name: a.label, visible: a.active })),
    fillings: list.filter((a) => a.group === 'FILLING').map((a) => ({ name: a.label, visible: a.active })),
  };
}

export async function saveTaxonomy(next: Taxonomy): Promise<boolean> {
  if (config.demoMode) {
    taxonomy.update(() => next);
    return mockResponse(true);
  }
  const res = await apiClient.get<ApiResponse<CakeAttributeDto[]>>(cakeAttributesApi, {
    params: { includeHidden: true },
  });
  const existing = res.data.data ?? [];

  const syncGroup = async (group: 'CRUST' | 'FILLING', items: { name: string; visible: boolean }[]) => {
    for (const item of items) {
      const found = existing.find((a) => a.group === group && a.label.toLowerCase() === item.name.trim().toLowerCase());
      if (found) {
        if (found.active !== item.visible) {
          await apiClient.patch(`${cakeAttributesApi}/${encodeURIComponent(found.id)}`, {
            active: item.visible,
          });
        }
      } else {
        const createdRes = await apiClient.post<ApiResponse<CakeAttributeDto>>(cakeAttributesApi, {
          group,
          label: item.name.trim(),
        });
        if (!item.visible && createdRes.data.data?.id) {
          await apiClient.patch(`${cakeAttributesApi}/${encodeURIComponent(createdRes.data.data.id)}`, {
            active: false,
          });
        }
      }
    }
  };

  await syncGroup('CRUST', next.crusts);
  await syncGroup('FILLING', next.fillings);
  return true;
}
