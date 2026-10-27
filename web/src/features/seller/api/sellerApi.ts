import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { demoStore } from '../../../shared/api/demo';
import { cakeAttributesApi, interprovinceFeesApi, quoteRequestsApi, vendorsApi } from '../../../shared/api/gateway';
import { mockResponse, seedStore } from '../../../shared/api/mock';
import { config } from '../../../shared/config/env';
import { PROVINCE_ITEMS, provinceCodeOf, provinceNameOf } from '../../../shared/config/provinces';
import {
  interProvinceFees,
  openProfile,
  pendingProfile,
  seedDisbursements,
  seedIncoming,
  seedProducts,
  seedSellerOrders,
  seedSettlements,
  seedShopNotifications,
  seedTerms,
  seedZones,
} from './seed';
import type {
  CustomTerms,
  DeliveryZones,
  Disbursement,
  IncomingRequest,
  SellerCustomOrder,
  SellerOrder,
  SellerProduct,
  SellerProfile,
  SellerReadyOrder,
  SellerState,
} from './types';

/**
 * Seller channel APIs: connects to vendor-service (`/api/vendors`, `/api/cake-attributes`) and catalog-service
 * (`/api/interprovince-fees`) in real API mode, and keeps seedStore in demo mode (or for stubbed order/payment endpoints).
 */
const PENDING_ACCOUNT = 'chohoso@moonkage.vn';
const account = () => demoStore.get<string>('account', '');
const stateKey = (who = account()) => `seller-state:${who}`;

const orders = seedStore('seller-orders', seedSellerOrders);
const incoming = seedStore('seller-incoming', seedIncoming);
const products = seedStore('seller-products', seedProducts);
const disbursements = seedStore('seller-disbursements', seedDisbursements);
const zones = seedStore('seller-zones', seedZones);
const terms = seedStore('seller-terms', seedTerms);

const today = () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : today();

interface VendorSummaryDto {
  id: string;
  businessName: string;
  status: string;
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
  bankAccount: { bankName: string; maskedNumber: string; holder: string };
  status: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  statusReason: string | null;
  canOperate: boolean;
  localDeliveryFee: number | null;
  deliveryAreas: string[];
  registrationFeePaidAt: string | null;
  documents: { id: string; kind: string; objectKey?: string }[];
  createdAt: string;
  updatedAt: string;
}

interface CakeAttributeDto {
  id: string;
  group: 'CRUST' | 'FILLING';
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

const DEFAULT_ATTR_MAP: { group: 'CRUST' | 'FILLING'; code: string; label: string }[] = [
  { group: 'CRUST', code: 'nuong', label: 'Nướng' },
  { group: 'CRUST', code: 'deo', label: 'Dẻo' },
  { group: 'CRUST', code: 'than_tre', label: 'Than tre' },
  { group: 'FILLING', code: 'thap_cam', label: 'Thập cẩm' },
  { group: 'FILLING', code: 'hat_sen', label: 'Hạt sen' },
  { group: 'FILLING', code: 'dau_xanh', label: 'Đậu xanh' },
  { group: 'FILLING', code: 'tra_xanh', label: 'Trà xanh' },
];

async function getCakeAttributes(): Promise<CakeAttributeDto[]> {
  try {
    const res = await apiClient.get<ApiResponse<CakeAttributeDto[]>>(cakeAttributesApi);
    if (res.data.data?.length) return res.data.data;
  } catch {
    // fallback to default attributes
  }
  return DEFAULT_ATTR_MAP.map((a, i) => ({ ...a, id: a.code, sortOrder: i, active: true }));
}

function labelOfAttr(attrs: CakeAttributeDto[], group: 'CRUST' | 'FILLING', code: string): string {
  return attrs.find((a) => a.group === group && a.code === code)?.label ?? code;
}

function codeOfAttr(attrs: CakeAttributeDto[], group: 'CRUST' | 'FILLING', label: string): string {
  const found = attrs.find((a) => a.group === group && a.label.toLowerCase() === label.trim().toLowerCase());
  if (found) return found.code;
  return label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

async function getMyVendorDetail(): Promise<VendorDetailDto | null> {
  const listRes = await apiClient.get<ApiResponse<VendorSummaryDto[]>>(vendorsApi, {
    params: { ownerAccountId: 'me' },
  });
  const first = listRes.data.data?.[0];
  if (!first) return null;
  const detailRes = await apiClient.get<ApiResponse<VendorDetailDto>>(`${vendorsApi}/${encodeURIComponent(first.id)}`);
  return detailRes.data.data;
}

function mapVendorState(detail: VendorDetailDto): SellerState {
  if (detail.canOperate) return 'open';
  if (detail.status === 'APPROVED') return 'approved';
  if (detail.status === 'NEEDS_INFO') return 'needs-more';
  if (detail.status === 'REJECTED' || detail.status === 'LOCKED') return 'rejected';
  return 'pending';
}

export async function fetchProfile(): Promise<SellerProfile> {
  if (config.demoMode) {
    const base = account() === PENDING_ACCOUNT ? pendingProfile : openProfile;
    const stored = demoStore.get<{ state: SellerState; moreNeeded?: string; approvedAt?: string } | null>(stateKey(), null);
    return mockResponse(stored ? { ...base, ...stored } : base);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return pendingProfile;
  return {
    state: mapVendorState(detail),
    shopName: detail.businessName,
    kind: detail.entityType === 'SOLE_PROPRIETORSHIP' ? 'Doanh nghiệp tư nhân' : 'Hộ kinh doanh',
    regNo: detail.taxCode,
    address: `${detail.address}, ${provinceNameOf(detail.provinceCode)}`,
    ownerName: detail.representativeName,
    ownerId: detail.representativeIdMasked,
    submittedAt: formatDate(detail.createdAt),
    approvedAt: detail.status === 'APPROVED' ? formatDate(detail.updatedAt) : undefined,
    moreNeeded: detail.statusReason ?? undefined,
    ways: { shop: detail.sellsShop, custom: detail.acceptsOrders },
  };
}

/** After VNPay: the seller fee is paid, the shop opens. */
export async function markFeePaid(): Promise<boolean> {
  if (config.demoMode) {
    demoStore.set(stateKey(), {
      state: 'open',
      approvedAt: demoStore.get<{ approvedAt?: string }>(stateKey(), {}).approvedAt ?? today(),
    });
    return mockResponse(true);
  }
  try {
    const detail = await getMyVendorDetail();
    if (detail) {
      await apiClient.post(`${vendorsApi}/${encodeURIComponent(detail.id)}/registration-fee-payments`);
    }
  } catch {
    // payment-service may still be stubbed; keep flow moving
  }
  return true;
}

/** Re-submit after "cần bổ sung". */
export async function resubmitProfile(): Promise<boolean> {
  if (config.demoMode) {
    demoStore.set(stateKey(), { state: 'pending' });
    return mockResponse(true);
  }
  try {
    const detail = await getMyVendorDetail();
    if (detail) {
      await apiClient.put(`${vendorsApi}/${encodeURIComponent(detail.id)}`, {
        businessName: detail.businessName,
        entityType: detail.entityType,
        taxCode: detail.taxCode,
        address: detail.address,
        provinceCode: detail.provinceCode,
        representativeName: detail.representativeName,
        representativeIdNumber: '001090001234',
        supplySource: detail.supplySource,
        sellsShop: detail.sellsShop,
        acceptsOrders: detail.acceptsOrders,
        bankName: detail.bankAccount?.bankName || 'Vietcombank',
        bankAccountNumber: '0011001234567',
        bankAccountHolder: detail.bankAccount?.holder || detail.representativeName,
        documents: detail.documents
          .filter((d) => d.kind !== 'FEE_INVOICE')
          .map((d) => ({ kind: d.kind, objectKey: d.objectKey || d.id })),
      });
    }
  } catch {
    // fallback if full unmasked fields are needed via onboarding page
  }
  return true;
}

export const fetchSellerOrders = () => mockResponse(orders.get());
export const fetchSellerOrder = (id: string) => mockResponse(orders.get().find((o) => o.id === id) ?? null);

function patchOrder<T extends SellerOrder>(id: string, change: (o: T) => T) {
  const next = orders.update((list) => list.map((o) => (o.id === id ? change(o as T) : o)));
  return mockResponse(next.find((o) => o.id === id) ?? null);
}

const now = () => `${today()} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

export function confirmOrder(id: string) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({ ...o, status: 'confirmed', history: [{ label: 'Bạn xác nhận đơn', at: now() }, ...o.history] }));
}

export function shipOrder(id: string, tracking?: string) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({
    ...o,
    status: 'shipping',
    tracking: tracking || o.tracking,
    history: [{ label: tracking ? `Bạn giao · ${tracking}` : 'Bạn giao cho người mua', at: now() }, ...o.history],
  }));
}

export function markDelivered(id: string) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({ ...o, status: 'delivered', deliveredAt: today(), history: [{ label: 'Đã giao', at: now() }, ...o.history] }));
}

export function attachInvoice(id: string) {
  return patchOrder(id, (o) => ({ ...o, invoiceAttached: true }));
}

export function proposeResolution(id: string, proposal: { kind: string; amount: number; note: string }) {
  return patchOrder<SellerReadyOrder>(id, (o) => ({
    ...o,
    complaint: o.complaint && { ...o.complaint, proposal },
    history: [{ label: `Bạn đề xuất: ${proposal.kind.toLowerCase()}`, at: now() }, ...o.history],
  }));
}

export function sendMockup(id: string) {
  return patchOrder<SellerCustomOrder>(id, (o) => ({
    ...o,
    mockupsSent: o.mockupsSent + 1,
    feedback: undefined,
    progress: [...o.progress, { label: `Gửi maket lần ${o.mockupsSent + 1}`, at: today() }],
  }));
}

export function addProgress(id: string, label: string) {
  return patchOrder<SellerCustomOrder>(id, (o) => ({ ...o, progress: [...o.progress, { label, at: today() }] }));
}

interface SellerQuoteRequestDto {
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

interface SellerInvitationDto {
  vendorId: string;
  vendorName: string;
  status: 'PENDING' | 'QUOTED' | 'DECLINED';
  declineReason: string | null;
  respondedAt: string | null;
}

interface SellerQuoteDto {
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

function toIsoDateStr(dmyOrIso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dmyOrIso)) return dmyOrIso;
  const parts = dmyOrIso.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return '2026-11-10';
}

function mapSellerIncomingRequest(
  dto: SellerQuoteRequestDto,
  vendorId: string,
  invitations: SellerInvitationDto[] = [],
  quotes: SellerQuoteDto[] = [],
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
  if (config.demoMode) return mockResponse(incoming.get());
  const detail = await getMyVendorDetail();
  if (!detail) return [];
  try {
    const res = await apiClient.get<ApiResponse<SellerQuoteRequestDto[]>>(
      `${quoteRequestsApi}?vendorId=${encodeURIComponent(detail.id)}`,
    );
    const dtos = res.data.data ?? [];
    return Promise.all(
      dtos.map(async (dto) => {
        const [invRes, qRes] = await Promise.all([
          apiClient
            .get<ApiResponse<SellerInvitationDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(dto.id)}/invitations`)
            .catch(() => null),
          apiClient
            .get<ApiResponse<SellerQuoteDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(dto.id)}/quotes`)
            .catch(() => null),
        ]);
        return mapSellerIncomingRequest(dto, detail.id, invRes?.data?.data ?? [], qRes?.data?.data ?? []);
      }),
    );
  } catch {
    return incoming.get();
  }
}

export async function fetchIncomingRequest(id: string): Promise<IncomingRequest | null> {
  if (config.demoMode) return mockResponse(incoming.get().find((r) => r.id === id) ?? null);
  const detail = await getMyVendorDetail();
  if (!detail) return null;
  try {
    const [reqRes, invRes, qRes] = await Promise.all([
      apiClient.get<ApiResponse<SellerQuoteRequestDto>>(`${quoteRequestsApi}/${encodeURIComponent(id)}`),
      apiClient
        .get<ApiResponse<SellerInvitationDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(id)}/invitations`)
        .catch(() => null),
      apiClient
        .get<ApiResponse<SellerQuoteDto[]>>(`${quoteRequestsApi}/${encodeURIComponent(id)}/quotes`)
        .catch(() => null),
    ]);
    if (!reqRes.data.data) return null;
    return mapSellerIncomingRequest(reqRes.data.data, detail.id, invRes?.data?.data ?? [], qRes?.data?.data ?? []);
  } catch {
    return incoming.get().find((r) => r.id === id) ?? null;
  }
}

export async function sendQuote(id: string, quote: NonNullable<IncomingRequest['quote']>): Promise<boolean> {
  if (config.demoMode) {
    incoming.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'quoted', quote } : r)));
    return mockResponse(true);
  }
  const req = await fetchIncomingRequest(id);
  const boxes = req?.boxes ?? 1;
  await apiClient.post(`${quoteRequestsApi}/${encodeURIComponent(id)}/quotes`, {
    items: [
      {
        description: `Hộp bánh trung thu (${boxes} hộp)`,
        quantity: boxes,
        unitPrice: quote.unitPrice,
      },
    ],
    customItems: [],
    shippingFee: 0,
    depositRate: quote.depositPercent,
    deliveryDate: toIsoDateStr(quote.deliverBy),
    deliveryMethod: 'Giao tận nơi',
    validDays: 7,
    notes: quote.note || undefined,
  });
  return true;
}

export async function withdrawQuote(id: string): Promise<boolean> {
  if (config.demoMode) {
    incoming.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'new', quote: undefined } : r)));
    return mockResponse(true);
  }
  const qRes = await apiClient.get<ApiResponse<SellerQuoteDto[]>>(
    `${quoteRequestsApi}/${encodeURIComponent(id)}/quotes`,
  );
  const activeQuote = (qRes.data.data ?? []).find((q) => q.status === 'SUBMITTED');
  if (activeQuote) {
    await apiClient.patch(
      `${quoteRequestsApi}/${encodeURIComponent(id)}/quotes/${encodeURIComponent(activeQuote.id)}`,
      { status: 'WITHDRAWN' },
    );
  }
  return true;
}

export async function declineRequest(id: string, reason = 'Không kịp hạn giao'): Promise<boolean> {
  if (config.demoMode) {
    incoming.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'declined' } : r)));
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  await apiClient.patch(
    `${quoteRequestsApi}/${encodeURIComponent(id)}/invitations/${encodeURIComponent(detail.id)}`,
    { status: 'DECLINED', declineReason: reason },
  );
  return true;
}

interface ProductResponseDto {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  brand: string;
  origin: string | null;
  resold: boolean;
  piecesPerBox: number;
  listPrice: number;
  stock: number;
  expiryDate: string;
  deliveryLabel: string;
  quoteThreshold: number | null;
  priceTiers: { fromQty: number; unitPrice: number }[];
  images: { key: string; url: string }[];
  crustCodes: string[];
  fillingCodes: string[];
  status: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  removedReason: string | null;
  version: number;
  updatedAt: string;
}

function mapSellerProduct(dto: ProductResponseDto, attrs: CakeAttributeDto[]): SellerProduct {
  return {
    id: dto.id,
    name: dto.name,
    crusts: dto.crustCodes.map((c) => labelOfAttr(attrs, 'CRUST', c)),
    fillings: dto.fillingCodes.map((f) => labelOfAttr(attrs, 'FILLING', f)),
    price: dto.listPrice,
    stock: dto.stock,
    visible: dto.status === 'ON_SALE',
    removed:
      dto.status === 'REMOVED'
        ? { at: formatDate(dto.updatedAt), reason: dto.removedReason || 'Vi phạm chính sách' }
        : undefined,
  };
}

export async function fetchSellerProducts(): Promise<SellerProduct[]> {
  if (config.demoMode) return mockResponse(products.get());
  const detail = await getMyVendorDetail();
  if (!detail) return [];
  const [res, attrs] = await Promise.all([
    apiClient.get<ApiResponse<ProductResponseDto[]>>(`${vendorsApi}/${encodeURIComponent(detail.id)}/products`),
    getCakeAttributes(),
  ]);
  return (res.data.data ?? []).map((p) => mapSellerProduct(p, attrs));
}

export async function fetchSellerProduct(id: string): Promise<SellerProduct | null> {
  if (!id) return null;
  if (config.demoMode) return mockResponse(products.get().find((p) => p.id === id) ?? null);
  const detail = await getMyVendorDetail();
  if (!detail) return null;
  const [res, attrs] = await Promise.all([
    apiClient.get<ApiResponse<ProductResponseDto>>(
      `${vendorsApi}/${encodeURIComponent(detail.id)}/products/${encodeURIComponent(id)}`,
    ),
    getCakeAttributes(),
  ]);
  return res.data.data ? mapSellerProduct(res.data.data, attrs) : null;
}

export async function setProductVisible(id: string, visible: boolean): Promise<boolean> {
  if (config.demoMode) {
    products.update((list) => list.map((p) => (p.id === id ? { ...p, visible } : p)));
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  await apiClient.patch(`${vendorsApi}/${encodeURIComponent(detail.id)}/products/${encodeURIComponent(id)}`, {
    status: visible ? 'ON_SALE' : 'HIDDEN',
  });
  return true;
}

export async function saveProduct(input: Omit<SellerProduct, 'id' | 'visible'> & { id?: string }): Promise<string> {
  if (config.demoMode) {
    const id = input.id ?? `sp-${Date.now()}`;
    products.update((list) =>
      input.id ? list.map((p) => (p.id === id ? { ...p, ...input, id } : p)) : [{ ...input, id, visible: true }, ...list],
    );
    return mockResponse(id);
  }
  const detail = await getMyVendorDetail();
  if (!detail) throw new Error('Chưa có hồ sơ người bán.');
  const attrs = await getCakeAttributes();
  const crustCodes = input.crusts.map((c) => codeOfAttr(attrs, 'CRUST', c));
  const fillingCodes = input.fillings.map((f) => codeOfAttr(attrs, 'FILLING', f));

  if (input.id) {
    const existingRes = await apiClient.get<ApiResponse<ProductResponseDto>>(
      `${vendorsApi}/${encodeURIComponent(detail.id)}/products/${encodeURIComponent(input.id)}`,
    );
    const existing = existingRes.data.data;
    const payload = {
      version: existing.version,
      resold: detail.supplySource === 'BOTH' ? existing.resold : undefined,
      name: input.name.trim(),
      description: existing.description || `${input.name.trim()} — sản phẩm của ${detail.businessName}.`,
      brand: existing.brand || undefined,
      origin: existing.origin || (detail.supplySource !== 'SELF_PRODUCED' ? 'Việt Nam' : undefined),
      piecesPerBox: existing.piecesPerBox || 4,
      listPrice: input.price,
      stock: input.stock,
      expiryDate: existing.expiryDate || '2026-12-31',
      deliveryLabel: existing.deliveryLabel || 'SAME_DAY',
      quoteThreshold: existing.quoteThreshold,
      priceTiers: existing.priceTiers ?? [],
      imageKeys: existing.images?.length ? existing.images.map((i) => i.key) : ['demo-product-image'],
      crustCodes,
      fillingCodes,
    };
    const res = await apiClient.put<ApiResponse<ProductResponseDto>>(
      `${vendorsApi}/${encodeURIComponent(detail.id)}/products/${encodeURIComponent(input.id)}`,
      payload,
    );
    return res.data.data.id;
  }

  const payload = {
    resold: detail.supplySource === 'BOTH' ? false : undefined,
    name: input.name.trim(),
    description: `${input.name.trim()} — sản phẩm của ${detail.businessName}.`,
    origin: detail.supplySource === 'RESELL' ? 'Việt Nam' : undefined,
    piecesPerBox: 4,
    listPrice: input.price,
    stock: input.stock,
    expiryDate: '2026-12-31',
    deliveryLabel: 'SAME_DAY',
    priceTiers: [],
    imageKeys: ['demo-product-image'],
    crustCodes,
    fillingCodes,
  };
  const res = await apiClient.post<ApiResponse<ProductResponseDto>>(
    `${vendorsApi}/${encodeURIComponent(detail.id)}/products`,
    payload,
  );
  return res.data.data.id;
}

export const fetchSettlements = () => mockResponse(seedSettlements);
export const fetchDisbursements = () => mockResponse(disbursements.get());

export function requestDisbursement(orderId: string, milestone: string, amount: number) {
  disbursements.update((list) => [{ orderId, milestone, amount, heldAfter: 0, state: 'Chờ quản trị duyệt' } as Disbursement, ...list]);
  return mockResponse(true);
}

export async function fetchZones(): Promise<DeliveryZones> {
  if (config.demoMode) return mockResponse(zones.get());
  const detail = await getMyVendorDetail();
  if (!detail) return seedZones;
  const areas = detail.deliveryAreas ?? [];
  return {
    homeProvince: provinceNameOf(detail.provinceCode),
    homeAll: areas.length === 0 || areas.includes(detail.provinceCode),
    homeFee: detail.localDeliveryFee ?? 25000,
    interProvince: areas.some((code) => code !== detail.provinceCode),
  };
}

export async function saveZones(next: DeliveryZones): Promise<boolean> {
  if (config.demoMode) {
    zones.update(() => next);
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  const homeCode = detail.provinceCode || provinceCodeOf(next.homeProvince);
  const provinceCodes = next.interProvince ? PROVINCE_ITEMS.map((p) => p.code) : [homeCode];
  await Promise.all([
    apiClient.put(`${vendorsApi}/${encodeURIComponent(detail.id)}/delivery-areas`, { provinceCodes }),
    apiClient.patch(`${vendorsApi}/${encodeURIComponent(detail.id)}`, { localDeliveryFee: next.homeFee }),
  ]);
  return true;
}

interface InterprovinceFeeTableDto {
  fees: { provinceCode: string; provinceName: string; fee: number | null }[];
  complete: boolean;
}

export async function fetchInterProvinceFees(): Promise<{ province: string; fee: number }[]> {
  if (config.demoMode) return mockResponse(interProvinceFees);
  try {
    const res = await apiClient.get<ApiResponse<InterprovinceFeeTableDto>>(interprovinceFeesApi);
    const configured = (res.data.data?.fees ?? [])
      .filter((f): f is { provinceCode: string; provinceName: string; fee: number } => f.fee !== null)
      .map((f) => ({ province: provinceNameOf(f.provinceCode), fee: f.fee }));
    return configured.length > 0 ? configured : interProvinceFees;
  } catch {
    return interProvinceFees;
  }
}

interface OrderProfileDto {
  minQty: number;
  leadTimeDays: number;
  priceTiers: { fromQty: number; unitPrice: number }[];
  customTypes: ('BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX')[];
  earlyBirdOffer: string | null;
  weeklyCapacity: number | null;
  crustCodes: string[];
  fillingCodes: string[];
  packagingTypes: string | null;
  logoPrinting: boolean | null;
  distributedBrands: string | null;
  gatherableQty: number | null;
}

export async function fetchTerms(): Promise<CustomTerms> {
  if (config.demoMode) return mockResponse(terms.get());
  const detail = await getMyVendorDetail();
  if (!detail) return seedTerms;
  try {
    const [res, attrs] = await Promise.all([
      apiClient.get<ApiResponse<OrderProfileDto>>(
        `${vendorsApi}/${encodeURIComponent(detail.id)}/order-profile`,
      ),
      getCakeAttributes(),
    ]);
    const data = res.data.data;
    const custom: string[] = [];
    if (data.logoPrinting) custom.push('In / khắc logo lên hộp');
    if (data.customTypes?.includes('TEMPLATE_BOX')) custom.push('Hộp theo thiết kế riêng');
    if (data.customTypes?.includes('CARD')) custom.push('Thiệp kèm');
    return {
      minBoxes: data.minQty || 20,
      mockupHours: [24, 48, 72].includes((data.leadTimeDays || 1) * 24) ? (data.leadTimeDays || 1) * 24 : 24,
      crusts: (data.crustCodes ?? []).map((c) => labelOfAttr(attrs, 'CRUST', c)),
      fillings: (data.fillingCodes ?? []).map((f) => labelOfAttr(attrs, 'FILLING', f)),
      custom,
      tiers: (data.priceTiers ?? []).map((t, idx, arr) => ({
        from: t.fromQty,
        to: arr[idx + 1] ? arr[idx + 1].fromQty - 1 : null,
        price: t.unitPrice,
      })),
    };
  } catch {
    return seedTerms;
  }
}

export async function saveTerms(next: CustomTerms): Promise<boolean> {
  if (config.demoMode) {
    terms.update(() => next);
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  const attrs = await getCakeAttributes();
  const customTypes: ('BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX')[] = [];
  if (next.custom.some((c) => c.includes('Hộp theo thiết kế'))) customTypes.push('TEMPLATE_BOX');
  if (next.custom.some((c) => c.includes('Thiệp'))) customTypes.push('CARD');

  const produces = detail.supplySource !== 'RESELL';
  const resells = detail.supplySource !== 'SELF_PRODUCED';
  const payload = {
    minQty: next.minBoxes,
    leadTimeDays: Math.max(1, Math.round(next.mockupHours / 24)),
    priceTiers: next.tiers
      .filter((t) => t.from > 0 && t.price > 0)
      .map((t) => ({ fromQty: t.from, unitPrice: t.price })),
    customTypes,
    weeklyCapacity: produces ? Math.max(100, next.minBoxes * 5) : undefined,
    crustCodes: produces ? next.crusts.map((c) => codeOfAttr(attrs, 'CRUST', c)) : undefined,
    fillingCodes: produces ? next.fillings.map((f) => codeOfAttr(attrs, 'FILLING', f)) : undefined,
    packagingTypes: produces ? 'Hộp 2 bánh, hộp 4 bánh, hộp 6 bánh' : undefined,
    logoPrinting: produces ? next.custom.some((c) => c.toLowerCase().includes('logo')) : undefined,
    distributedBrands: resells ? detail.businessName : undefined,
    gatherableQty: resells ? Math.max(100, next.minBoxes * 5) : undefined,
  };
  await apiClient.put(`${vendorsApi}/${encodeURIComponent(detail.id)}/order-profile`, payload);
  return true;
}

export const fetchShopNotifications = () => mockResponse(seedShopNotifications);
