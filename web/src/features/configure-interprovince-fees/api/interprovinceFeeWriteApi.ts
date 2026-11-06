import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import {
  mapFeeTableDto,
  type InterprovinceFeeTable,
} from '@/entities/interprovince-fee';

/**
 * The write side of the interprovincial fee table (FR-52, AC-52.1, AC-52.3).
 *
 * The backend replaces the whole table, so the request carries one row per
 * province: a missing province is rejected with `INCOMPLETE_FEE_TABLE`
 * (`InterprovinceFeeServiceImpl.validateTable`).
 */

/** One row of the request (`SaveInterprovinceFeesRequest.Fee`). */
export type FeeRow = {
  /** 2-digit national code, e.g. `01`. */
  provinceCode: string;
  /** Amount in VND; the backend rejects a negative one. */
  fee: number;
};

/**
 * Replace the whole fee table (admin only).
 *
 * `PUT /api/interprovince-fees` — the answer is the table as it was stored, so
 * the screen shows what the backend kept.
 */
export async function replaceFeeTable(fees: FeeRow[]): Promise<InterprovinceFeeTable> {
  if (isDemoMode()) {
    return { fees: [], complete: false };
  }
  const res = await apiClient.put<unknown>(GATEWAY.LOGISTICS.INTERPROVINCE_FEES, { fees });
  const dto = unwrap<Parameters<typeof mapFeeTableDto>[0]>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về biểu phí vừa lưu.');
  }
  return mapFeeTableDto(dto);
}
