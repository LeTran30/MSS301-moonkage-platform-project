/**
 * The 34 provincial units of Viet Nam with their 2-digit national codes
 * (Quyết định 19/2025/QĐ-TTg), matching `com.moonkage.reference.Province` on the backend.
 *
 * Backend endpoints that filter by region expect the numeric `provinceCode`
 * (e.g. `GET /api/products?provinceCode=01`), not the province name.
 */

export interface ProvinceItem {
  code: string;
  name: string;
  officialName: string;
}

export const PROVINCE_ITEMS: readonly ProvinceItem[] = [
  { code: '01', name: 'Hà Nội', officialName: 'Thành phố Hà Nội' },
  { code: '04', name: 'Cao Bằng', officialName: 'Tỉnh Cao Bằng' },
  { code: '08', name: 'Tuyên Quang', officialName: 'Tỉnh Tuyên Quang' },
  { code: '11', name: 'Điện Biên', officialName: 'Tỉnh Điện Biên' },
  { code: '12', name: 'Lai Châu', officialName: 'Tỉnh Lai Châu' },
  { code: '14', name: 'Sơn La', officialName: 'Tỉnh Sơn La' },
  { code: '15', name: 'Lào Cai', officialName: 'Tỉnh Lào Cai' },
  { code: '19', name: 'Thái Nguyên', officialName: 'Tỉnh Thái Nguyên' },
  { code: '20', name: 'Lạng Sơn', officialName: 'Tỉnh Lạng Sơn' },
  { code: '22', name: 'Quảng Ninh', officialName: 'Tỉnh Quảng Ninh' },
  { code: '24', name: 'Bắc Ninh', officialName: 'Tỉnh Bắc Ninh' },
  { code: '25', name: 'Phú Thọ', officialName: 'Tỉnh Phú Thọ' },
  { code: '31', name: 'Hải Phòng', officialName: 'Thành phố Hải Phòng' },
  { code: '33', name: 'Hưng Yên', officialName: 'Tỉnh Hưng Yên' },
  { code: '37', name: 'Ninh Bình', officialName: 'Tỉnh Ninh Bình' },
  { code: '38', name: 'Thanh Hóa', officialName: 'Tỉnh Thanh Hóa' },
  { code: '40', name: 'Nghệ An', officialName: 'Tỉnh Nghệ An' },
  { code: '42', name: 'Hà Tĩnh', officialName: 'Tỉnh Hà Tĩnh' },
  { code: '44', name: 'Quảng Trị', officialName: 'Tỉnh Quảng Trị' },
  { code: '46', name: 'Huế', officialName: 'Thành phố Huế' },
  { code: '48', name: 'Đà Nẵng', officialName: 'Thành phố Đà Nẵng' },
  { code: '51', name: 'Quảng Ngãi', officialName: 'Tỉnh Quảng Ngãi' },
  { code: '52', name: 'Gia Lai', officialName: 'Tỉnh Gia Lai' },
  { code: '56', name: 'Khánh Hòa', officialName: 'Tỉnh Khánh Hòa' },
  { code: '66', name: 'Đắk Lắk', officialName: 'Tỉnh Đắk Lắk' },
  { code: '68', name: 'Lâm Đồng', officialName: 'Tỉnh Lâm Đồng' },
  { code: '75', name: 'Đồng Nai', officialName: 'Tỉnh Đồng Nai' },
  { code: '79', name: 'TP Hồ Chí Minh', officialName: 'Thành phố Hồ Chí Minh' },
  { code: '80', name: 'Tây Ninh', officialName: 'Tỉnh Tây Ninh' },
  { code: '82', name: 'Đồng Tháp', officialName: 'Tỉnh Đồng Tháp' },
  { code: '86', name: 'Vĩnh Long', officialName: 'Tỉnh Vĩnh Long' },
  { code: '91', name: 'An Giang', officialName: 'Tỉnh An Giang' },
  { code: '92', name: 'Cần Thơ', officialName: 'Thành phố Cần Thơ' },
  { code: '96', name: 'Cà Mau', officialName: 'Tỉnh Cà Mau' },
];

const PROVINCE_BY_NAME = new Map<string, ProvinceItem>();
for (const item of PROVINCE_ITEMS) {
  PROVINCE_BY_NAME.set(normalizeProvinceName(item.name), item);
  PROVINCE_BY_NAME.set(normalizeProvinceName(item.officialName), item);
}

/**
 * Normalise a province name for lookup: lower case, drop the abbreviation dots
 * (`TP. Hồ Chí Minh` = `TP Hồ Chí Minh`) and collapse the spaces.
 */
function normalizeProvinceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The province used when the caller has not chosen one yet. */
export const DEFAULT_PROVINCE_CODE = '01';

/** Numeric code of a province name; falls back to Hà Nội when the name is unknown. */
export function provinceCodeOf(name: string | undefined | null): string {
  if (!name) return DEFAULT_PROVINCE_CODE;
  const trimmed = name.trim();
  if (/^\d{2}$/.test(trimmed)) return trimmed;
  const found = PROVINCE_BY_NAME.get(normalizeProvinceName(trimmed));
  return found ? found.code : DEFAULT_PROVINCE_CODE;
}

/** Display name of a numeric code; empty string when the code is unknown. */
export function provinceNameOf(code: string | undefined | null): string {
  if (!code) return '';
  return PROVINCE_ITEMS.find((p) => p.code === code)?.name ?? '';
}

export const ALL_PROVINCE_NAMES: readonly string[] = PROVINCE_ITEMS.map((p) => p.name);
