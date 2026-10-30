import type { AdminProduct } from '../model/adminProductTypes';

/** Admin seed from the wireframe (q1-0 … q6-4). */
export const seedAdminProducts: AdminProduct[] = [
  { id: 'hop-hoang-kim-4-banh', name: 'Hộp Hoàng Kim 4 bánh', shop: 'Xưởng Bánh Nghệ Nhân', price: 680000 },
  { id: 'hop-hoang-kim-dac-biet', name: 'Hộp Hoàng Kim Đặc Biệt', shop: 'Xưởng Bánh Nghệ Nhân', price: 720000 },
  { id: 'hop-trang-ram-4-banh', name: 'Hộp Trăng Rằm 4 bánh', shop: 'Bánh Cổ Truyền Trăng Vàng', price: 420000 },
  { id: 'banh-deo-hat-sen-150g', name: 'Bánh dẻo hạt sen 150g', shop: 'Bánh Cổ Truyền Trăng Vàng', price: 65000 },
  { id: 'hop-thu-vang-4-banh', name: 'Hộp Thu Vàng 4 bánh', shop: 'Xưởng Bánh Nghệ Nhân', price: 450000, removed: { reason: 'Ảnh không đúng sản phẩm', at: '20/10/2026' } },
];

