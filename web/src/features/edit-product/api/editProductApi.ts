import { codeOfAttr, getCakeAttributes, getMyVendorDetail, vendorProductStore, type ProductResponseDto, type VendorProduct } from '@/entities/vendor';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

export async function setProductVisible(id: string, visible: boolean): Promise<boolean> {
  if (config.demoMode) {
    vendorProductStore.update((list) => list.map((p) => (p.id === id ? { ...p, visible } : p)));
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  await apiClient.patch(`${vendorsApi}/${encodeURIComponent(detail.id)}/products/${encodeURIComponent(id)}`, {
    status: visible ? 'ON_SALE' : 'HIDDEN',
  });
  return true;
}

export async function saveProduct(input: Omit<VendorProduct, 'id' | 'visible'> & { id?: string }): Promise<string> {
  if (config.demoMode) {
    const id = input.id ?? `sp-${Date.now()}`;
    vendorProductStore.update((list) =>
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
