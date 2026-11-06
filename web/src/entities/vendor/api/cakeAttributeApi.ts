import { apiClient, GATEWAY, unwrapList } from '@/shared/api';

import type { CakeAttributeDto } from './vendorDto';

/**
 * The catalogue of crusts and fillings (FR-54).
 *
 * Without `codes` the endpoint answers the visible values for the buyer filter
 * and the seller picker; with `codes` it answers the labels of those codes,
 * hidden ones included, for a product page (AC-54.4).
 */
export const cakeAttributeApi = {
  /** The catalogue values, optionally of one group only. */
  async list(group?: 'CRUST' | 'FILLING', includeHidden = false): Promise<CakeAttributeDto[]> {
    const params = new URLSearchParams();
    if (group) params.set('group', group);
    if (includeHidden) params.set('includeHidden', 'true');
    const query = params.toString();
    const res = await apiClient.get<unknown>(
      query ? `${GATEWAY.VENDOR.CAKE_ATTRIBUTES}?${query}` : GATEWAY.VENDOR.CAKE_ATTRIBUTES,
    );
    return unwrapList<CakeAttributeDto>(res);
  },

  /** The labels of the given codes, hidden ones included (AC-54.4). */
  async labelsOf(codes: string[]): Promise<CakeAttributeDto[]> {
    if (codes.length === 0) {
      return [];
    }
    const params = new URLSearchParams();
    codes.forEach((code) => params.append('codes', code));
    const res = await apiClient.get<unknown>(
      `${GATEWAY.VENDOR.CAKE_ATTRIBUTES}?${params.toString()}`,
    );
    return unwrapList<CakeAttributeDto>(res);
  },
};
