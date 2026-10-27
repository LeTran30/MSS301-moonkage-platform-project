import type { VendorProduct } from '../model/vendorProductTypes';

/** Products of Xưởng Bánh Nghệ Nhân, the open demo shop. */
export const seedProducts: VendorProduct[] = [
  { id: 'hop-hoang-kim-4-banh', name: 'Hộp Hoàng Kim 4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'], price: 680000, stock: 42, visible: true },
  { id: 'hop-doan-vien-6-banh', name: 'Hộp Đoàn Viên 6 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen', 'Đậu xanh'], price: 890000, stock: 9, visible: true },
  { id: 'banh-nuong-dau-xanh-200g', name: 'Bánh nướng đậu xanh 200g', crusts: ['Nướng'], fillings: ['Đậu xanh'], price: 85000, stock: 3, visible: true },
  { id: 'hop-hat-sen-2-banh', name: 'Hộp Hạt Sen 2 bánh', crusts: ['Nướng'], fillings: ['Hạt sen'], price: 320000, stock: 15, visible: false },
  { id: 'hop-thu-vang-4-banh', name: 'Hộp Thu Vàng 4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Đậu xanh'], price: 450000, stock: 12, visible: false, removed: { at: '20/10/2026', reason: 'Ảnh không đúng sản phẩm' } },
];
