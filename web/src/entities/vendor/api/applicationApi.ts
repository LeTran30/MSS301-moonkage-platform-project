import { apiClient, type ApiResponse } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceNameOf } from '@/shared/config/provinces';
import { formatDate } from '@/shared/utils/format';
import type { ApplicationState, VendorApplication } from '../model/applicationTypes';
import { seedApplications } from './applicationSeed';

/** Vendor applications on vendor-service, reviewed by an admin (Q2). */
export const applicationStore = seedStore('admin-applications', seedApplications);

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

function mapVendorDetailToApplication(detail: VendorDetailDto, reviews: VendorReviewDto[]): VendorApplication {
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

export async function fetchApplications(): Promise<VendorApplication[]> {
  if (config.demoMode) return mockResponse(applicationStore.get());
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

export async function fetchApplication(id: string): Promise<VendorApplication | null> {
  if (!id) return null;
  if (config.demoMode) return mockResponse(applicationStore.get().find((a) => a.id === id) ?? null);
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

