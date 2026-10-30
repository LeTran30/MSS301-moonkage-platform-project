import type { CustomTerms } from '../model/types';
import type { DeliveryZones } from '../model/deliveryZones';

/** Settings of Xưởng Bánh Nghệ Nhân, the open demo shop. */
export const seedZones: DeliveryZones = { homeProvince: 'Hà Nội', homeAll: true, homeFee: 25000, interProvince: true };

export const seedTerms: CustomTerms = {
  minBoxes: 20, mockupHours: 24, crusts: ['Nướng', 'Dẻo'], fillings: ['Thập cẩm', 'Hạt sen', 'Đậu xanh'], custom: ['In / khắc logo lên hộp', 'Thiệp kèm'],
  tiers: [
    { from: 20, to: 99, price: 130000 },
    { from: 100, to: 199, price: 120000 },
    { from: 200, to: null, price: 110000 },
  ],
};

export const interProvinceFees = [
  { province: 'TP Hồ Chí Minh', fee: 35000 },
  { province: 'Đà Nẵng', fee: 35000 },
  { province: 'Hải Phòng', fee: 30000 },
  { province: 'Cần Thơ', fee: 40000 },
];
