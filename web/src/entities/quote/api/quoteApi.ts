import { apiClient, type ApiResponse } from '@/shared/api/client';
import { quoteRequestsApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceNameOf } from '@/shared/config/provinces';
import type { Quote, QuoteRequest, RequestStatus } from '../model/types';

interface DeliveryAddressDto {
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  addressDetail: string;
}

export interface QuoteRequestDto {
  id: string;
  type: 'DIRECT' | 'OPEN';
  buyerAccountId: string;
  targetVendorId: string | null;
  productId: string | null;
  quantity: number;
  budget: number | null;
  customTypes: ('BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX')[];
  customSpec: string | null;
  deliveryDeadline: string;
  delivery: DeliveryAddressDto | null;
  status: 'OPEN' | 'AWARDED' | 'CLOSED' | 'EXPIRED';
  invitedCount: number;
  quoteCount: number;
  suggestedUnitPrice?: number | null;
  createdAt: string;
}

interface InvitationDto {
  vendorId: string;
  vendorName: string;
  status: 'PENDING' | 'QUOTED' | 'DECLINED';
  declineReason: string | null;
  respondedAt: string | null;
}

interface QuoteItemDto {
  lineNo: number;
  kind: 'PRODUCT' | 'CUSTOM';
  description: string;
  productRef: string | null;
  customType: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface QuoteDto {
  id: string;
  requestId: string;
  vendorId: string;
  vendorName: string;
  revisionNo: number;
  supersedesQuoteId: string | null;
  items: QuoteItemDto[];
  itemsAmount: number;
  customSurcharge: number;
  shippingFee: number;
  totalAmount: number;
  depositRate: number;
  depositAmount: number;
  remainingAmount: number;
  deliveryDate: string;
  deliveryMethod: string;
  validUntil: string;
  notes: string | null;
  status: 'SUBMITTED' | 'WITHDRAWN' | 'EXPIRED' | 'ACCEPTED' | 'CLOSED' | 'REJECTED';
  acceptable: boolean;
  submittedAt: string;
  withdrawnAt: string | null;
}

function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return iso.split('-').reverse().join('/');
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function toIsoDate(dmyOrIso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dmyOrIso)) return dmyOrIso;
  const parts = dmyOrIso.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return '2026-11-15';
}

function mapQuoteDto(dto: QuoteDto, requestBoxes: number): Quote {
  return {
    id: dto.id,
    vendorId: dto.vendorId,
    vendorName: dto.vendorName || dto.vendorId,
    total: dto.totalAmount,
    boxes: requestBoxes,
    depositPercent: Number(dto.depositRate) || 50,
    deliverBy: formatIsoDate(dto.deliveryDate),
    custom: dto.notes || dto.items.map((i) => i.description).join(' · ') || 'Theo yêu cầu',
    rating: 4.8,
    customOrders: 15,
    expired: !dto.acceptable && dto.status !== 'ACCEPTED',
  };
}

function mapRequestStatus(dto: QuoteRequestDto, quotes: QuoteDto[]): RequestStatus {
  if (dto.status === 'AWARDED') return 'accepted';
  if (dto.status === 'CLOSED' || dto.status === 'EXPIRED') return 'closed';
  return (dto.quoteCount > 0 || quotes.length > 0) ? 'new-quotes' : 'waiting';
}

export function mapRequestDto(
  dto: QuoteRequestDto,
  invitations: InvitationDto[] = [],
  quoteDtos: QuoteDto[] = [],
): QuoteRequest {
  const quotes = quoteDtos
    .filter((q) => q.status !== 'WITHDRAWN')
    .map((q) => mapQuoteDto(q, dto.quantity));
  const acceptedQuote = quoteDtos.find((q) => q.status === 'ACCEPTED');
  const deliverProvince = dto.delivery?.provinceCode ? provinceNameOf(dto.delivery.provinceCode) : 'Hà Nội';
  const deliverTo = dto.delivery?.addressDetail
    ? `${dto.delivery.addressDetail}, ${deliverProvince}`
    : deliverProvince;
  const invited =
    invitations.length > 0
      ? invitations.map((i) => ({ vendorId: i.vendorId, vendorName: i.vendorName || i.vendorId }))
      : Array.from({ length: dto.invitedCount }, (_, idx) => ({
          vendorId: `inv-${idx + 1}`,
          vendorName: `Đơn vị #${idx + 1}`,
        }));

  return {
    id: dto.id,
    kind: dto.type === 'DIRECT' ? 'direct' : 'open',
    directTo: dto.type === 'DIRECT' ? (invited[0]?.vendorName ?? dto.targetVendorId ?? undefined) : undefined,
    boxes: dto.quantity,
    perBox: '4 bánh',
    crusts: ['Nướng'],
    fillings: ['Thập cẩm', 'Hạt sen'],
    custom: dto.customSpec || 'In logo lên hộp',
    deliverTo,
    deliverBy: formatIsoDate(dto.deliveryDeadline),
    createdAt: formatIsoDate(dto.createdAt),
    status: mapRequestStatus(dto, quoteDtos),
    invited,
    quotes,
    acceptedVendorId: acceptedQuote?.vendorId,
  };
}

/** Buyer requests from the wireframe (m6-2, m6-2-1). */
const seedRequests: QuoteRequest[] = [
  {
    id: 'YC-104', kind: 'open', boxes: 150, perBox: '4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'],
    custom: 'In logo lên hộp', deliverTo: 'Cầu Giấy, Hà Nội', deliverBy: '15/11/2026', createdAt: '20/10/2026', status: 'new-quotes',
    invited: [
      { vendorId: 'nghe-nhan', vendorName: 'Xưởng Bánh Nghệ Nhân' },
      { vendorId: 'trang-vang', vendorName: 'Bánh Cổ Truyền Trăng Vàng' },
      { vendorId: 'minh-hoa', vendorName: 'Xưởng Minh Hòa' },
    ],
    quotes: [
      { vendorId: 'nghe-nhan', vendorName: 'Xưởng Bánh Nghệ Nhân', total: 18000000, boxes: 150, depositPercent: 50, deliverBy: '10/11/2026', custom: 'Khắc laser nắp gỗ', rating: 4.9, customOrders: 42 },
      { vendorId: 'trang-vang', vendorName: 'Bánh Cổ Truyền Trăng Vàng', total: 16500000, boxes: 150, depositPercent: 50, deliverBy: '14/11/2026', custom: 'In logo nắp giấy', rating: 4.8, customOrders: 28 },
    ],
  },
  {
    id: 'YC-098', kind: 'direct', directTo: 'Xưởng Bánh Nghệ Nhân', boxes: 120, perBox: 'Hộp gỗ 4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'],
    custom: 'Khắc laser logo công ty lên nắp hộp gỗ', deliverTo: 'Cầu Giấy, Hà Nội', deliverBy: '15/11/2026', createdAt: '15/10/2026', status: 'waiting',
    invited: [{ vendorId: 'nghe-nhan', vendorName: 'Xưởng Bánh Nghệ Nhân' }], quotes: [],
  },
  {
    id: 'YC-090', kind: 'direct', directTo: 'Bánh Cổ Truyền Trăng Vàng', boxes: 80, perBox: '4 bánh', crusts: ['Nướng'], fillings: ['Đậu xanh'],
    custom: 'Hộp sơn mài in tên công ty', deliverTo: 'Ba Đình, Hà Nội', deliverBy: '20/10/2026', createdAt: '01/10/2026', status: 'accepted',
    acceptedVendorId: 'trang-vang', invited: [{ vendorId: 'trang-vang', vendorName: 'Bánh Cổ Truyền Trăng Vàng' }],
    quotes: [{ vendorId: 'trang-vang', vendorName: 'Bánh Cổ Truyền Trăng Vàng', total: 12000000, boxes: 80, depositPercent: 50, deliverBy: '20/10/2026', custom: 'Hộp sơn mài in tên', rating: 4.8, customOrders: 28 }],
  },
];

export const quoteRequestStore = seedStore<QuoteRequest[]>('buyer-requests', seedRequests);

export async function fetchRequests(): Promise<QuoteRequest[]> {
  if (config.demoMode) {
    return mockResponse(quoteRequestStore.get());
  }
  const res = await apiClient.get<ApiResponse<QuoteRequestDto[]>>(quoteRequestsApi);
  const dtos = res.data.data ?? [];
  return Promise.all(
    dtos.map(async (dto) => {
      const [invRes, quotesRes] = await Promise.all([
        apiClient
          .get<ApiResponse<InvitationDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(dto.id)}/invitations`)
          .catch(() => null),
        apiClient
          .get<ApiResponse<QuoteDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(dto.id)}/quotes`)
          .catch(() => null),
      ]);
      return mapRequestDto(dto, invRes?.data?.data ?? [], quotesRes?.data?.data ?? []);
    }),
  );
}

export async function fetchRequest(requestId: string): Promise<QuoteRequest | null> {
  if (config.demoMode) {
    return mockResponse(quoteRequestStore.get().find((r) => r.id === requestId) ?? null);
  }
  try {
    const [reqRes, invRes, quotesRes] = await Promise.all([
      apiClient.get<ApiResponse<QuoteRequestDto>>(`${quoteRequestsApi}/${encodeURIComponent(requestId)}`),
      apiClient
        .get<ApiResponse<InvitationDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(requestId)}/invitations`)
        .catch(() => null),
      apiClient
        .get<ApiResponse<QuoteDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(requestId)}/quotes`)
        .catch(() => null),
    ]);
    if (!reqRes.data.data) return null;
    return mapRequestDto(reqRes.data.data, invRes?.data?.data ?? [], quotesRes?.data?.data ?? []);
  } catch {
    return quoteRequestStore.get().find((r) => r.id === requestId) ?? null;
  }
}

