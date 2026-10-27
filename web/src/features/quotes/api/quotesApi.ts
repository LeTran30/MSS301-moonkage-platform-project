import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { quoteRequestsApi } from '../../../shared/api/gateway';
import { mockResponse, seedStore } from '../../../shared/api/mock';
import { config } from '../../../shared/config/env';
import { provinceCodeOf, provinceNameOf } from '../../../shared/config/provinces';
import type { Quote, QuoteRequest, RequestStatus } from './types';

interface DeliveryAddressDto {
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  addressDetail: string;
}

interface QuoteRequestDto {
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

function toIsoDate(dmyOrIso: string): string {
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
    supplierId: dto.vendorId,
    supplierName: dto.vendorName || dto.vendorId,
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

function mapRequestDto(
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
      ? invitations.map((i) => ({ supplierId: i.vendorId, supplierName: i.vendorName || i.vendorId }))
      : Array.from({ length: dto.invitedCount }, (_, idx) => ({
          supplierId: `inv-${idx + 1}`,
          supplierName: `Đơn vị #${idx + 1}`,
        }));

  return {
    id: dto.id,
    kind: dto.type === 'DIRECT' ? 'direct' : 'open',
    directTo: dto.type === 'DIRECT' ? (invited[0]?.supplierName ?? dto.targetVendorId ?? undefined) : undefined,
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
    acceptedSupplierId: acceptedQuote?.vendorId,
  };
}

/** Buyer requests from the wireframe (m6-2, m6-2-1). */
const seedRequests: QuoteRequest[] = [
  {
    id: 'YC-104', kind: 'open', boxes: 150, perBox: '4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'],
    custom: 'In logo lên hộp', deliverTo: 'Cầu Giấy, Hà Nội', deliverBy: '15/11/2026', createdAt: '20/10/2026', status: 'new-quotes',
    invited: [
      { supplierId: 'nghe-nhan', supplierName: 'Xưởng Bánh Nghệ Nhân' },
      { supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng' },
      { supplierId: 'minh-hoa', supplierName: 'Xưởng Minh Hòa' },
    ],
    quotes: [
      { supplierId: 'nghe-nhan', supplierName: 'Xưởng Bánh Nghệ Nhân', total: 18000000, boxes: 150, depositPercent: 50, deliverBy: '10/11/2026', custom: 'Khắc laser nắp gỗ', rating: 4.9, customOrders: 42 },
      { supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng', total: 16500000, boxes: 150, depositPercent: 50, deliverBy: '14/11/2026', custom: 'In logo nắp giấy', rating: 4.8, customOrders: 28 },
    ],
  },
  {
    id: 'YC-098', kind: 'direct', directTo: 'Xưởng Bánh Nghệ Nhân', boxes: 120, perBox: 'Hộp gỗ 4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'],
    custom: 'Khắc laser logo công ty lên nắp hộp gỗ', deliverTo: 'Cầu Giấy, Hà Nội', deliverBy: '15/11/2026', createdAt: '15/10/2026', status: 'waiting',
    invited: [{ supplierId: 'nghe-nhan', supplierName: 'Xưởng Bánh Nghệ Nhân' }], quotes: [],
  },
  {
    id: 'YC-090', kind: 'direct', directTo: 'Bánh Cổ Truyền Trăng Vàng', boxes: 80, perBox: '4 bánh', crusts: ['Nướng'], fillings: ['Đậu xanh'],
    custom: 'Hộp sơn mài in tên công ty', deliverTo: 'Ba Đình, Hà Nội', deliverBy: '20/10/2026', createdAt: '01/10/2026', status: 'accepted',
    acceptedSupplierId: 'trang-vang', invited: [{ supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng' }],
    quotes: [{ supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng', total: 12000000, boxes: 80, depositPercent: 50, deliverBy: '20/10/2026', custom: 'Hộp sơn mài in tên', rating: 4.8, customOrders: 28 }],
  },
];

const requests = seedStore<QuoteRequest[]>('buyer-requests', seedRequests);
const today = () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export async function fetchRequests(): Promise<QuoteRequest[]> {
  if (config.demoMode) {
    return mockResponse(requests.get());
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
    return mockResponse(requests.get().find((r) => r.id === requestId) ?? null);
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
    return requests.get().find((r) => r.id === requestId) ?? null;
  }
}

export type NewRequest = Omit<QuoteRequest, 'id' | 'createdAt' | 'quotes' | 'status' | 'acceptedSupplierId'>;

export async function createRequest(input: NewRequest): Promise<QuoteRequest> {
  if (config.demoMode) {
    const request: QuoteRequest = { ...input, id: `YC-${105 + requests.get().length}`, createdAt: today(), quotes: [], status: 'waiting' };
    requests.update((list) => [request, ...list]);
    return mockResponse(request);
  }
  const customTypes: ('BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX')[] = ['TEMPLATE_BOX'];
  if (input.custom.toLowerCase().includes('thiệp')) customTypes.push('CARD');
  const specParts = [
    `Quy cách: ${input.perBox}`,
    `Vỏ: ${input.crusts.join(', ')}`,
    `Nhân: ${input.fillings.join(', ')}`,
    `Làm riêng: ${input.custom}`,
    ...(input.note ? [`Ghi chú: ${input.note}`] : []),
  ];
  const payload = {
    type: input.kind === 'direct' ? 'DIRECT' : 'OPEN',
    targetVendorId: input.kind === 'direct' ? input.invited[0]?.supplierId : undefined,
    quantity: input.boxes,
    customTypes,
    customSpec: specParts.join(' · '),
    deliveryDeadline: toIsoDate(input.deliverBy),
    delivery: {
      recipientName: 'Người nhận hàng',
      recipientPhone: '0901234567',
      provinceCode: provinceCodeOf(input.deliverTo),
      addressDetail: input.deliverTo || 'Hà Nội',
    },
  };
  const res = await apiClient.post<ApiResponse<QuoteRequestDto>>(quoteRequestsApi, payload);
  return mapRequestDto(res.data.data);
}

export async function closeRequest(requestId: string): Promise<QuoteRequest | null> {
  const next = requests.update((list) => list.map((r) => (r.id === requestId ? { ...r, status: 'closed' } : r)));
  if (config.demoMode) {
    return mockResponse(next.find((r) => r.id === requestId) ?? null);
  }
  const current = await fetchRequest(requestId);
  return current ? { ...current, status: 'closed' } : null;
}

/** Accepting one quote is binding: the other quotes of the request close (BR-17). */
export async function acceptQuote(requestId: string, supplierId: string): Promise<{ request: QuoteRequest; quote: Quote } | null> {
  if (config.demoMode) {
    const next = requests.update((list) => list.map((r) => (r.id === requestId ? { ...r, status: 'accepted', acceptedSupplierId: supplierId } : r)));
    const request = next.find((r) => r.id === requestId);
    const quote = request?.quotes.find((q) => q.supplierId === supplierId);
    return mockResponse(request && quote ? { request, quote } : null);
  }
  const request = await fetchRequest(requestId);
  const quote = request?.quotes.find((q) => q.supplierId === supplierId);
  if (!request || !quote) return null;
  if (quote.id) {
    await apiClient.post(
      `${quoteRequestsApi}/${encodeURIComponent(requestId)}/quotes/${encodeURIComponent(quote.id)}/acceptance`,
      {},
    );
  }
  return {
    request: { ...request, status: 'accepted', acceptedSupplierId: supplierId },
    quote,
  };
}
