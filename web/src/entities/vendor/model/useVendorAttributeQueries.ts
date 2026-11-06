import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { cakeAttributeApi } from '../api/cakeAttributeApi';
import type { CakeAttributeDto } from '../api/vendorDto';

/**
 * The catalogue of crusts and fillings (FR-54).
 *
 * `includeHidden` answers the hidden values too, for the admin screen.
 */
export function useCakeAttributes(options?: { group?: 'CRUST' | 'FILLING'; includeHidden?: boolean }) {
  const group = options?.group;
  const includeHidden = options?.includeHidden ?? false;
  return useQueryData(queryKeys.vendorAttribute.list(group ?? '', includeHidden), () =>
    cakeAttributeApi.list(group, includeHidden),
  );
}

export type { CakeAttributeDto };
