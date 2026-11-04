import { useCallback } from 'react';
import { createCakeAttribute, updateCakeAttribute } from '../api/cakeAttributeWriteApi';
import type {
  CakeAttributeDto,
  CreateCakeAttributePayload,
  UpdateCakeAttributePayload,
} from '@/entities/vendor';

/**
 * The admin adds a crust or a filling to the catalogue (FR-54, AC-54.1).
 *
 * The `code` and the position come from the label; the code never changes
 * afterwards (AC-54.3).
 */
export function useCreateCakeAttribute() {
  return useCallback(
    (payload: CreateCakeAttributePayload): Promise<CakeAttributeDto | null> =>
      createCakeAttribute(payload),
    [],
  );
}

/** The admin shows or hides one catalogue value (AC-54.3). */
export function useUpdateCakeAttribute() {
  return useCallback(
    (attributeId: string, payload: UpdateCakeAttributePayload): Promise<CakeAttributeDto | null> =>
      updateCakeAttribute(attributeId, payload),
    [],
  );
}
