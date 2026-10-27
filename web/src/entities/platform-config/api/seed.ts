import type { ProvinceFee, Taxonomy } from '../model/types';

/** The 34 provinces and cities after the 2025 merger (the wireframe counts 63: to confirm with the team). */
export const provinces = [
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Nội',
  'Hà Tĩnh', 'Hải Phòng', 'Huế', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lạng Sơn', 'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ',
  'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'TP Hồ Chí Minh', 'Tuyên Quang', 'Vĩnh Long',
];

const NEAR = ['Bắc Ninh', 'Hưng Yên', 'Hải Phòng', 'Ninh Bình', 'Phú Thọ', 'Thái Nguyên', 'Quảng Ninh', 'Hà Nội'];
/** Cà Mau left empty on purpose: the page refuses to save with a gap (AC-52.3). */
export const seedProvinceFees: ProvinceFee[] = provinces.map((p) => ({ province: p, fee: p === 'Cà Mau' ? null : NEAR.includes(p) ? 30000 : 45000 }));

export const seedTaxonomy: Taxonomy = {
  crusts: [
    { name: 'Nướng', visible: true },
    { name: 'Dẻo', visible: true },
    { name: 'Than tre', visible: false },
  ],
  fillings: [
    { name: 'Thập cẩm', visible: true },
    { name: 'Hạt sen', visible: true },
    { name: 'Đậu xanh', visible: true },
    { name: 'Trà xanh', visible: true },
    { name: 'Khoai môn', visible: true },
  ],
};

