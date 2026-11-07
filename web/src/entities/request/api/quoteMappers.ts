import { provinceNameOf } from '@/shared/config';
import type { Quote, QuoteRequest } from '../model/requestStore';
import type { QuoteDto, QuoteRequestDto } from './quoteDto';

/**
 * `depositRate` is a percent (30 = 30%); the UI keeps the same unit.
 * The backend refuses more than two decimals.
 */
function depositPercent(rate: number | null | undefined): number {
  if (rate === null || rate === undefined) return 0;
  return Math.round(rate * 100) / 100;
}

/** Map a backend request to the UI entity. */
export function mapQuoteRequestDto(dto: QuoteRequestDto): QuoteRequest {
  const provinceCode = dto.delivery?.provinceCode ?? '';
  return {
    id: dto.id,
    type: dto.type === 'DIRECT' ? 'DIRECT' : 'OPEN',
    buyerId: dto.buyerAccountId || '',
    buyerName: dto.delivery?.recipientName || '',
    targetVendorId: dto.targetVendorId,
    targetVendorName: undefined,
    quantity: dto.quantity ?? 0,
    deliveryDeadline: dto.deliveryDeadline ?? '',
    deliveryAddress: dto.delivery?.addressDetail ?? '',
    deliveryProvince: provinceNameOf(provinceCode) || provinceCode,
    budgetPerBox: dto.budget ?? dto.suggestedUnitPrice ?? undefined,
    customRequirements: dto.customSpec,
    customTypes: dto.customTypes ?? [],
    productId: dto.productId,
    recipientName: dto.delivery?.recipientName,
    recipientPhone: dto.delivery?.recipientPhone,
    provinceCode,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    status: dto.status ?? 'OPEN',
    invitedVendorsCount: dto.invitedCount ?? 0,
    quoteCount: dto.quoteCount ?? 0,
    quotes: [],
  };
}

/** Map a backend quote to the UI entity. */
export function mapQuoteDto(dto: QuoteDto): Quote {
  const productLine = dto.items?.find((i) => i.kind === 'PRODUCT') ?? dto.items?.[0];
  const unitPrice = productLine?.unitPrice ?? 0;
  return {
    id: dto.id,
    vendorId: dto.vendorId ?? '',
    vendorName: dto.vendorName ?? '',
    vendorRating: 0,
    unitPrice,
    shippingFee: dto.shippingFee ?? 0,
    totalPrice: dto.totalAmount ?? 0,
    depositPercent: depositPercent(dto.depositRate),
    depositAmount: dto.depositAmount ?? 0,
    remainingAmount: dto.remainingAmount ?? 0,
    estimatedDeliveryDate: dto.deliveryDate ?? '',
    deliveryMethod: dto.deliveryMethod ?? '',
    validUntil: dto.validUntil ?? '',
    note: dto.notes,
    status: dto.status ?? 'SUBMITTED',
    revisionNo: dto.revisionNo,
    acceptable: dto.acceptable ?? true,
  };
}

/** The deposit rate the backend expects, in percent (30 → 30). */
export function toBackendDepositRate(percent: number): number {
  return Math.round(percent * 100) / 100;
}
