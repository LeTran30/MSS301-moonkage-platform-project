import { apiClient, GATEWAY, unwrap } from '@/shared/api';

/**
 * Wire shape of `com.moonkage.catalog.dto.response.InterprovinceFeeResponse`.
 *
 * A null `fee` means "not configured yet", never "free delivery"
 * (`InterprovinceFeeServiceImpl.getProvinceFee`).
 */
export interface InterprovinceFeeDto {
  provinceCode: string;
  provinceName: string;
  fee: number | null;
  effectiveFrom?: string | null;
}

/** Wire shape of `com.moonkage.catalog.dto.response.InterprovinceFeeTableResponse`. */
export interface InterprovinceFeeTableDto {
  fees: InterprovinceFeeDto[];
  /** true when every province of the table has a fee. */
  complete: boolean;
}

/** One row of the interprovincial fee table. */
export type InterprovinceFee = {
  provinceCode: string;
  provinceName: string;
  /** null = not configured yet (never free). */
  fee: number | null;
  effectiveFrom?: string;
};

/** The whole table, with the flag that says whether it is usable yet. */
export type InterprovinceFeeTable = {
  fees: InterprovinceFee[];
  complete: boolean;
};

/** Map the backend table to the UI shape. */
export function mapFeeTableDto(dto: InterprovinceFeeTableDto): InterprovinceFeeTable {
  return {
    fees: (dto.fees ?? []).map((row) => ({
      provinceCode: row.provinceCode,
      provinceName: row.provinceName,
      fee: row.fee ?? null,
      effectiveFrom: row.effectiveFrom ?? undefined,
    })),
    complete: Boolean(dto.complete),
  };
}

/**
 * The read side of the interprovincial fee table (FR-52, A-18).
 *
 * The table belongs to catalog-service: it is the only place that computes the
 * shipping fee of a buy-now order (D-14). The write (`replaceFeeTable`) belongs
 * to the `configure-interprovince-fees` feature.
 */
export const interprovinceFeeApi = {
  /** The whole table (FR-52). */
  async getTable(): Promise<InterprovinceFeeTable> {
    const res = await apiClient.get<unknown>(GATEWAY.LOGISTICS.INTERPROVINCE_FEES);
    const dto = unwrap<InterprovinceFeeTableDto>(res);
    if (!dto) {
      throw new Error('Máy chủ không trả về biểu phí liên tỉnh.');
    }
    return mapFeeTableDto(dto);
  },

  /** The fee of one province (FR-52). */
  async getProvinceFee(provinceCode: string): Promise<InterprovinceFee> {
    const res = await apiClient.get<unknown>(
      GATEWAY.LOGISTICS.INTERPROVINCE_FEE_BY_PROVINCE(provinceCode),
    );
    const dto = unwrap<InterprovinceFeeDto>(res);
    if (!dto) {
      throw new Error('Máy chủ không trả về phí giao của tỉnh này.');
    }
    return {
      provinceCode: dto.provinceCode,
      provinceName: dto.provinceName,
      fee: dto.fee ?? null,
      effectiveFrom: dto.effectiveFrom ?? undefined,
    };
  },
};
