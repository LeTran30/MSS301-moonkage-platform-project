/**
 * Sample / standard administrative wards categorized by province code.
 * Follows General Statistics Office of Vietnam (Tổng cục Thống kê) administrative codes.
 */

export interface WardItem {
  code: string;
  name: string;
  provinceCode: string;
  district?: string;
}

export const WARDS_BY_PROVINCE: Record<string, readonly WardItem[]> = {
  // 01: Hà Nội
  '01': [
    { code: '00001', name: 'Phường Phúc Xá', provinceCode: '01', district: 'Quận Ba Đình' },
    { code: '00004', name: 'Phường Trúc Bạch', provinceCode: '01', district: 'Quận Ba Đình' },
    { code: '00006', name: 'Phường Vĩnh Phúc', provinceCode: '01', district: 'Quận Ba Đình' },
    { code: '00007', name: 'Phường Cống Vị', provinceCode: '01', district: 'Quận Ba Đình' },
    { code: '00008', name: 'Phường Liễu Giai', provinceCode: '01', district: 'Quận Ba Đình' },
    { code: '00010', name: 'Phường Quán Thánh', provinceCode: '01', district: 'Quận Ba Đình' },
    { code: '00013', name: 'Phường Thành Công', provinceCode: '01', district: 'Quận Ba Đình' },
    { code: '00037', name: 'Phường Hàng Bạc', provinceCode: '01', district: 'Quận Hoàn Kiếm' },
    { code: '00040', name: 'Phường Hàng Buồm', provinceCode: '01', district: 'Quận Hoàn Kiếm' },
    { code: '00043', name: 'Phường Hàng Đào', provinceCode: '01', district: 'Quận Hoàn Kiếm' },
    { code: '00046', name: 'Phường Hàng Gai', provinceCode: '01', district: 'Quận Hoàn Kiếm' },
    { code: '00049', name: 'Phường Cửa Đông', provinceCode: '01', district: 'Quận Hoàn Kiếm' },
    { code: '00052', name: 'Phường Cửa Nam', provinceCode: '01', district: 'Quận Hoàn Kiếm' },
    { code: '00055', name: 'Phường Tràng Tiền', provinceCode: '01', district: 'Quận Hoàn Kiếm' },
    { code: '00157', name: 'Phường Dịch Vọng', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00160', name: 'Phường Dịch Vọng Hậu', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00163', name: 'Phường Mai Dịch', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00166', name: 'Phường Nghĩa Đô', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00169', name: 'Phường Nghĩa Tân', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00172', name: 'Phường Quan Hoa', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00175', name: 'Phường Trung Hòa', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00178', name: 'Phường Yên Hòa', provinceCode: '01', district: 'Quận Cầu Giấy' },
    { code: '00229', name: 'Phường Kim Liên', provinceCode: '01', district: 'Quận Đống Đa' },
    { code: '00232', name: 'Phường Ô Chợ Dừa', provinceCode: '01', district: 'Quận Đống Đa' },
    { code: '00235', name: 'Phường Văn Miếu', provinceCode: '01', district: 'Quận Đống Đa' },
  ],
  // 79: TP Hồ Chí Minh
  '79': [
    { code: '26734', name: 'Phường Bến Nghé', provinceCode: '79', district: 'Quận 1' },
    { code: '26737', name: 'Phường Bến Thành', provinceCode: '79', district: 'Quận 1' },
    { code: '26740', name: 'Phường Cầu Kho', provinceCode: '79', district: 'Quận 1' },
    { code: '26743', name: 'Phường Cầu Ông Lãnh', provinceCode: '79', district: 'Quận 1' },
    { code: '26746', name: 'Phường Cô Giang', provinceCode: '79', district: 'Quận 1' },
    { code: '26749', name: 'Phường Đa Kao', provinceCode: '79', district: 'Quận 1' },
    { code: '26752', name: 'Phường Nguyễn Cư Trinh', provinceCode: '79', district: 'Quận 1' },
    { code: '26755', name: 'Phường Nguyễn Thái Bình', provinceCode: '79', district: 'Quận 1' },
    { code: '26758', name: 'Phường Phạm Ngũ Lão', provinceCode: '79', district: 'Quận 1' },
    { code: '26761', name: 'Phường Tân Định', provinceCode: '79', district: 'Quận 1' },
    { code: '26800', name: 'Phường Võ Thị Sáu', provinceCode: '79', district: 'Quận 3' },
    { code: '26803', name: 'Phường 1', provinceCode: '79', district: 'Quận 3' },
    { code: '26806', name: 'Phường 2', provinceCode: '79', district: 'Quận 3' },
    { code: '26860', name: 'Phường Thảo Điền', provinceCode: '79', district: 'TP Thủ Đức' },
    { code: '26863', name: 'Phường An Phú', provinceCode: '79', district: 'TP Thủ Đức' },
    { code: '26866', name: 'Phường Thủ Thiêm', provinceCode: '79', district: 'TP Thủ Đức' },
    { code: '27139', name: 'Phường Tân Phong', provinceCode: '79', district: 'Quận 7' },
    { code: '27142', name: 'Phường Tân Phú', provinceCode: '79', district: 'Quận 7' },
  ],
  // 31: Hải Phòng
  '31': [
    { code: '11281', name: 'Phường Hoàng Văn Thụ', provinceCode: '31', district: 'Quận Hồng Bàng' },
    { code: '11284', name: 'Phường Minh Khai', provinceCode: '31', district: 'Quận Hồng Bàng' },
    { code: '11287', name: 'Phường Phan Bội Châu', provinceCode: '31', district: 'Quận Hồng Bàng' },
    { code: '11311', name: 'Phường Cầu Đất', provinceCode: '31', district: 'Quận Ngô Quyền' },
    { code: '11314', name: 'Phường Lạc Viên', provinceCode: '31', district: 'Quận Ngô Quyền' },
    { code: '11341', name: 'Phường An Dương', provinceCode: '31', district: 'Quận Lê Chân' },
    { code: '11344', name: 'Phường Lam Sơn', provinceCode: '31', district: 'Quận Lê Chân' },
  ],
  // 48: Đà Nẵng
  '48': [
    { code: '20194', name: 'Phường Thạch Thang', provinceCode: '48', district: 'Quận Hải Châu' },
    { code: '20197', name: 'Phường Hải Châu I', provinceCode: '48', district: 'Quận Hải Châu' },
    { code: '20200', name: 'Phường Hải Châu II', provinceCode: '48', district: 'Quận Hải Châu' },
    { code: '20203', name: 'Phường Phước Ninh', provinceCode: '48', district: 'Quận Hải Châu' },
    { code: '20206', name: 'Phường Hòa Thuận Tây', provinceCode: '48', district: 'Quận Hải Châu' },
    { code: '20227', name: 'Phường An Hải Bắc', provinceCode: '48', district: 'Quận Sơn Trà' },
    { code: '20230', name: 'Phường Phước Mỹ', provinceCode: '48', district: 'Quận Sơn Trà' },
    { code: '20257', name: 'Phường Mỹ An', provinceCode: '48', district: 'Quận Ngũ Hành Sơn' },
  ],
  // 92: Cần Thơ
  '92': [
    { code: '31117', name: 'Phường An Cư', provinceCode: '92', district: 'Quận Ninh Kiều' },
    { code: '31120', name: 'Phường An Hòa', provinceCode: '92', district: 'Quận Ninh Kiều' },
    { code: '31123', name: 'Phường An Khánh', provinceCode: '92', district: 'Quận Ninh Kiều' },
    { code: '31126', name: 'Phường An Nghiệp', provinceCode: '92', district: 'Quận Ninh Kiều' },
    { code: '31129', name: 'Phường Tân An', provinceCode: '92', district: 'Quận Ninh Kiều' },
    { code: '31132', name: 'Phường Xuân Khánh', provinceCode: '92', district: 'Quận Ninh Kiều' },
    { code: '31144', name: 'Phường Hưng Lợi', provinceCode: '92', district: 'Quận Ninh Kiều' },
    { code: '31150', name: 'Phường Bình Thủy', provinceCode: '92', district: 'Quận Bình Thủy' },
  ],
};

/**
 * Get wards for a given province (by 2-digit code or province name).
 * If specific wards for that province are not yet in the mock list, returns a generic structured set.
 */
export function getWardsForProvince(provinceCodeOrName: string): readonly WardItem[] {
  const code = provinceCodeOrName.trim();
  if (WARDS_BY_PROVINCE[code]) {
    return WARDS_BY_PROVINCE[code];
  }

  // Fallback default wards for other provinces
  return [
    { code: `${code}-01`, name: 'Phường 1', provinceCode: code },
    { code: `${code}-02`, name: 'Phường 2', provinceCode: code },
    { code: `${code}-03`, name: 'Phường 3', provinceCode: code },
    { code: `${code}-tt`, name: 'Thị trấn trung tâm', provinceCode: code },
    { code: `${code}-x1`, name: 'Xã Phú Hưng', provinceCode: code },
    { code: `${code}-x2`, name: 'Xã Tân Thành', provinceCode: code },
  ];
}

