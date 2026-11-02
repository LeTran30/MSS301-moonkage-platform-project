import { apiClient, type ApiResponse } from '@/shared/api/client';
import { cakeAttributesApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

interface CakeAttributeDto {
  group: 'CRUST' | 'FILLING';
  code: string;
  label: string;
  sortOrder: number;
}

/** code → label of each group, in the catalogue's order (L-19: vendor-service owns it, codes never change). */
export interface CakeAttributeLabels {
  crusts: Record<string, string>;
  fillings: Record<string, string>;
}

/** The seed catalogue of vendor-service, for the demo mode only. */
const DEMO_ATTRIBUTES: CakeAttributeDto[] = [
  { group: 'CRUST', code: 'banh-nuong', label: 'Bánh nướng', sortOrder: 1 },
  { group: 'CRUST', code: 'banh-deo', label: 'Bánh dẻo', sortOrder: 2 },
  { group: 'CRUST', code: 'banh-lanh', label: 'Bánh lạnh', sortOrder: 3 },
  { group: 'CRUST', code: 'khac', label: 'Khác', sortOrder: 99 },
  { group: 'FILLING', code: 'thap-cam', label: 'Thập cẩm', sortOrder: 1 },
  { group: 'FILLING', code: 'dau-xanh', label: 'Đậu xanh', sortOrder: 2 },
  { group: 'FILLING', code: 'hat-sen', label: 'Hạt sen', sortOrder: 3 },
  { group: 'FILLING', code: 'dau-do', label: 'Đậu đỏ', sortOrder: 4 },
  { group: 'FILLING', code: 'khoai-mon', label: 'Khoai môn', sortOrder: 5 },
  { group: 'FILLING', code: 'tra-xanh', label: 'Trà xanh', sortOrder: 6 },
  { group: 'FILLING', code: 'sau-rieng', label: 'Sầu riêng', sortOrder: 7 },
  { group: 'FILLING', code: 'trung-muoi', label: 'Trứng muối', sortOrder: 8 },
  { group: 'FILLING', code: 'khac', label: 'Khác', sortOrder: 99 },
];

function toLabels(list: CakeAttributeDto[]): CakeAttributeLabels {
  const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  const of = (group: CakeAttributeDto['group']) =>
    Object.fromEntries(sorted.filter((a) => a.group === group).map((a) => [a.code, a.label]));
  return { crusts: of('CRUST'), fillings: of('FILLING') };
}

export async function fetchCakeAttributeLabels(): Promise<CakeAttributeLabels> {
  if (config.demoMode) return mockResponse(toLabels(DEMO_ATTRIBUTES));
  const res = await apiClient.get<ApiResponse<CakeAttributeDto[]>>(cakeAttributesApi);
  return toLabels(res.data.data ?? []);
}

/** The label of a code; the code itself while the labels load or for a value hidden since. */
export function labelOf(labels: Record<string, string> | undefined, code: string): string {
  return labels?.[code] ?? code;
}
