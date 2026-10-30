import { apiClient, type ApiResponse } from '@/shared/api/client';
import { quoteRequestsApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceNameOf } from '@/shared/config/provinces';
import { formatDate } from '@/shared/utils/format';
import { getMyVendorDetail } from './vendorApi';
import { seedIncoming } from './incomingSeed';
import type { IncomingRequest } from '../model/incomingRequest';

/** Quote requests the shop was invited to or can answer (quotation-service), and its quotes on them. */
export const incomingRequestStore = seedStore('vendor-incoming', seedIncoming);

interface VendorQuoteRequestDto {
  id: string;
  type: 'DIRECT' | 'OPEN';
  buyerAccountId: string;
  targetVendorId: string | null;
  productId: string | null;
  quantity: number;
  budget: number | null;
  customTypes: string[];
  customSpec: string | null;
  deliveryDeadline: string;
  delivery: {
    recipientName: string;
    recipientPhone: string;
    provinceCode: string;
    addressDetail: string;
  } | null;
  status: 'OPEN' | 'AWARDED' | 'CLOSED' | 'EXPIRED';
  invitedCount: number;
  quoteCount: number;
  suggestedUnitPrice?: number | null;
  createdAt: string;
}

interface VendorInvitationDto {
  vendorId: string;
  vendorName: string;
  status: 'PENDING' | 'QUOTED' | 'DECLINED';
  declineReason: string | null;
  respondedAt: string | null;
}

export interface VendorQuoteDto {
  id: string;
  requestId: string;
  vendorId: string;
  vendorName: string;
  itemsAmount: number;
  totalAmount: number;
  depositRate: number;
  deliveryDate: string;
  validUntil: string;
  notes: string | null;
  status: 'SUBMITTED' | 'WITHDRAWN' | 'EXPIRED' | 'ACCEPTED' | 'CLOSED' | 'REJECTED';
}


function mapVendorIncomingRequest(
  dto: VendorQuoteRequestDto,
  vendorId: string,
  invitations: VendorInvitationDto[] = [],
  quotes: VendorQuoteDto[] = [],
): IncomingRequest {
  const myInv = invitations.find((i) => i.vendorId === vendorId);
  const myQuote = quotes.find((q) => q.vendorId === vendorId && q.status !== 'WITHDRAWN');
  let state: IncomingRequest['state'] = 'new';
  if (dto.status === 'CLOSED' || dto.status === 'EXPIRED' || dto.status === 'AWARDED') {
    state = myQuote ? 'quoted' : 'closed';
  } else if (myInv?.status === 'DECLINED') {
    state = 'declined';
  } else if (myQuote || myInv?.status === 'QUOTED') {
    state = 'quoted';
  }
  const province = dto.delivery?.provinceCode ? provinceNameOf(dto.delivery.provinceCode) : 'Hà Nội';
  const deliverTo = dto.delivery?.addressDetail ? `${dto.delivery.addressDetail}, ${province}` : province;
  return {
    id: dto.id,
    boxes: dto.quantity,
    perBox: '4 bánh',
    summary: dto.customSpec || (dto.customTypes ?? []).join(', ') || 'Làm riêng theo yêu cầu',
    invitation: dto.type === 'DIRECT' ? 'direct' : 'open',
    buyer: dto.delivery?.recipientName || 'Khách hàng doanh nghiệp',
    buyerVerified: true,
    deliverTo,
    deliverBy: formatDate(dto.deliveryDeadline),
    hoursLeft: dto.status === 'OPEN' ? 48 : 0,
    note: dto.customSpec || undefined,
    files: [],
    state,
    quote: myQuote
      ? {
          unitPrice: Math.round(myQuote.totalAmount / Math.max(1, dto.quantity)),
          depositPercent: Number(myQuote.depositRate) || 50,
          deliverBy: formatDate(myQuote.deliveryDate),
          validUntil: formatDate(myQuote.validUntil),
          note: myQuote.notes || '',
        }
      : undefined,
  };
}

export async function fetchIncoming(): Promise<IncomingRequest[]> {
  if (config.demoMode) return mockResponse(incomingRequestStore.get());
  const detail = await getMyVendorDetail();
  if (!detail) return [];
  try {
    const res = await apiClient.get<ApiResponse<VendorQuoteRequestDto[]>>(
      `${quoteRequestsApi}?vendorId=${encodeURIComponent(detail.id)}`,
    );
    const dtos = res.data.data ?? [];
    return Promise.all(
      dtos.map(async (dto) => {
        const [invRes, qRes] = await Promise.all([
          apiClient
            .get<ApiResponse<VendorInvitationDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(dto.id)}/invitations`)
            .catch(() => null),
          apiClient
            .get<ApiResponse<VendorQuoteDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(dto.id)}/quotes`)
            .catch(() => null),
        ]);
        return mapVendorIncomingRequest(dto, detail.id, invRes?.data?.data ?? [], qRes?.data?.data ?? []);
      }),
    );
  } catch {
    return incomingRequestStore.get();
  }
}

export async function fetchIncomingRequest(id: string): Promise<IncomingRequest | null> {
  if (config.demoMode) return mockResponse(incomingRequestStore.get().find((r) => r.id === id) ?? null);
  const detail = await getMyVendorDetail();
  if (!detail) return null;
  try {
    const [reqRes, invRes, qRes] = await Promise.all([
      apiClient.get<ApiResponse<VendorQuoteRequestDto>>(`${quoteRequestsApi}/${encodeURIComponent(id)}`),
      apiClient
        .get<ApiResponse<VendorInvitationDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(id)}/invitations`)
        .catch(() => null),
      apiClient
        .get<ApiResponse<VendorQuoteDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(id)}/quotes`)
        .catch(() => null),
    ]);
    if (!reqRes.data.data) return null;
    return mapVendorIncomingRequest(reqRes.data.data, detail.id, invRes?.data?.data ?? [], qRes?.data?.data ?? []);
  } catch {
    return incomingRequestStore.get().find((r) => r.id === id) ?? null;
  }
}
