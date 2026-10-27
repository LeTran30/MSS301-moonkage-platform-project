/**
 * The 34 provincial units of Viet Nam with their 2-digit national codes (Quyết định 19/2025/QĐ-TTg),
 * matching `com.moonkage.reference.Province` on the backend.
 */
export interface ProvinceItem {
  code: string;
  name: string;
  officialName: string;
}

export const PROVINCE_ITEMS: readonly ProvinceItem[] = [
  { code: '01', name: 'Hà Nội', officialName: 'Thành phố Hà Nội' },
  { code: '79', name: 'TP Hồ Chí Minh', officialName: 'Thành phố Hồ Chí Minh' },
  { code: '31', name: 'Hải Phòng', officialName: 'Thành phố Hải Phòng' },
  { code: '48', name: 'Đà Nẵng', officialName: 'Thành phố Đà Nẵng' },
  { code: '92', name: 'Cần Thơ', officialName: 'Thành phố Cần Thơ' },
  { code: '91', name: 'An Giang', officialName: 'Tỉnh An Giang' },
  { code: '24', name: 'Bắc Ninh', officialName: 'Tỉnh Bắc Ninh' },
  { code: '96', name: 'Cà Mau', officialName: 'Tỉnh Cà Mau' },
  { code: '04', name: 'Cao Bằng', officialName: 'Tỉnh Cao Bằng' },
  { code: '66', name: 'Đắk Lắk', officialName: 'Tỉnh Đắk Lắk' },
  { code: '11', name: 'Điện Biên', officialName: 'Tỉnh Điện Biên' },
  { code: '75', name: 'Đồng Nai', officialName: 'Tỉnh Đồng Nai' },
  { code: '82', name: 'Đồng Tháp', officialName: 'Tỉnh Đồng Tháp' },
  { code: '52', name: 'Gia Lai', officialName: 'Tỉnh Gia Lai' },
  { code: '42', name: 'Hà Tĩnh', officialName: 'Tỉnh Hà Tĩnh' },
  { code: '46', name: 'Huế', officialName: 'Thành phố Huế' },
  { code: '33', name: 'Hưng Yên', officialName: 'Tỉnh Hưng Yên' },
  { code: '56', name: 'Khánh Hòa', officialName: 'Tỉnh Khánh Hòa' },
  { code: '12', name: 'Lai Châu', officialName: 'Tỉnh Lai Châu' },
  { code: '20', name: 'Lạng Sơn', officialName: 'Tỉnh Lạng Sơn' },
  { code: '15', name: 'Lào Cai', officialName: 'Tỉnh Lào Cai' },
  { code: '68', name: 'Lâm Đồng', officialName: 'Tỉnh Lâm Đồng' },
  { code: '40', name: 'Nghệ An', officialName: 'Tỉnh Nghệ An' },
  { code: '37', name: 'Ninh Bình', officialName: 'Tỉnh Ninh Bình' },
  { code: '25', name: 'Phú Thọ', officialName: 'Tỉnh Phú Thọ' },
  { code: '51', name: 'Quảng Ngãi', officialName: 'Tỉnh Quảng Ngãi' },
  { code: '22', name: 'Quảng Ninh', officialName: 'Tỉnh Quảng Ninh' },
  { code: '44', name: 'Quảng Trị', officialName: 'Tỉnh Quảng Trị' },
  { code: '14', name: 'Sơn La', officialName: 'Tỉnh Sơn La' },
  { code: '80', name: 'Tây Ninh', officialName: 'Tỉnh Tây Ninh' },
  { code: '19', name: 'Thái Nguyên', officialName: 'Tỉnh Thái Nguyên' },
  { code: '38', name: 'Thanh Hóa', officialName: 'Tỉnh Thanh Hóa' },
  { code: '08', name: 'Tuyên Quang', officialName: 'Tỉnh Tuyên Quang' },
  { code: '86', name: 'Vĩnh Long', officialName: 'Tỉnh Vĩnh Long' },
];

export const DEFAULT_PROVINCE_CODE = '01';
export const DEFAULT_PROVINCE_NAME = 'Hà Nội';

/** Short display names of all 34 provinces (major cities first). */
export const ALL_PROVINCE_NAMES: string[] = PROVINCE_ITEMS.map((p) => p.name);

function normaliseKey(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}

/** Find a province entry by its 2-digit code (`"01"`), short name (`"Hà Nội"`) or official name (`"Thành phố Hà Nội"`). */
export function findProvince(codeOrName: string | null | undefined): ProvinceItem | undefined {
  if (!codeOrName) return undefined;
  const trimmed = codeOrName.trim();
  const byExact = PROVINCE_ITEMS.find(
    (p) => p.code === trimmed || p.name === trimmed || p.officialName === trimmed,
  );
  if (byExact) return byExact;
  const key = normaliseKey(trimmed);
  return PROVINCE_ITEMS.find(
    (p) => normaliseKey(p.name) === key || normaliseKey(p.officialName) === key || key.endsWith(normaliseKey(p.name)),
  );
}

/** Resolves any province name or code to the 2-digit national code (defaults to `'01'` Hà Nội). */
export function provinceCodeOf(codeOrName: string | null | undefined): string {
  return findProvince(codeOrName)?.code ?? DEFAULT_PROVINCE_CODE;
}

/** Resolves any province code or official name to the short UI display name (e.g. `'Hà Nội'`, `'TP Hồ Chí Minh'`). */
export function provinceNameOf(codeOrName: string | null | undefined): string {
  return findProvince(codeOrName)?.name ?? (codeOrName?.trim() || DEFAULT_PROVINCE_NAME);
}

/** Resolves any province code or short name to the official name expected by `SaveAddressRequest.provinceName`. */
export function provinceOfficialNameOf(codeOrName: string | null | undefined): string {
  return findProvince(codeOrName)?.officialName ?? (codeOrName?.trim() || 'Thành phố Hà Nội');
}
