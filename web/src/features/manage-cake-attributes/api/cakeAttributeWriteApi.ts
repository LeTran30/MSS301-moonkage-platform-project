import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type {
  CakeAttributeDto,
  CreateCakeAttributePayload,
  UpdateCakeAttributePayload,
} from '@/entities/vendor';

/**
 * The write side of the catalogue of crusts and fillings (FR-54, AC-54.1).
 *
 * The vendor entity owns the read and the shape of the catalogue; the writes
 * live here because they change the platform catalogue, not the vendor data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Admin: a new value; the code and the position come from the label (AC-54.1). */
export async function createCakeAttribute(
  payload: CreateCakeAttributePayload,
): Promise<CakeAttributeDto | null> {
  const res = await apiClient.post<unknown>(GATEWAY.VENDOR.CAKE_ATTRIBUTES, payload);
  return unwrap<CakeAttributeDto>(res);
}

/** Admin: a partial change; the code and the group never change (AC-54.3). */
export async function updateCakeAttribute(
  attributeId: string,
  payload: UpdateCakeAttributePayload,
): Promise<CakeAttributeDto | null> {
  const res = await apiClient.patch<unknown>(
    `${GATEWAY.VENDOR.CAKE_ATTRIBUTES}/${attributeId}`,
    payload,
  );
  return unwrap<CakeAttributeDto>(res);
}
