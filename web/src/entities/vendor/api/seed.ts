import type { VendorProfile } from '../model/types';

/** Vendor seed from the wireframe (b1-0 … b7-0), for Xưởng Bánh Nghệ Nhân. */
export const openProfile: VendorProfile = {
  state: 'open', shopName: 'Xưởng Bánh Nghệ Nhân', kind: 'Hộ kinh doanh', regNo: '01J8001928', address: '12 Phan Kế Bính, Ba Đình, Hà Nội',
  ownerName: 'VŨ THỊ MAI HOA', ownerId: '0011******22', submittedAt: '22/10/2026', approvedAt: '24/10/2026', ways: { shop: true, custom: true },
};

/** The profile of the "chờ duyệt" demo account; Admin (Q2.1) moves it on. */
export const pendingProfile: VendorProfile = {
  state: 'pending', shopName: 'Tiệm Bánh Thảo Mộc', kind: 'Hộ kinh doanh', regNo: '01K9002231', address: '8 Ngõ Huế, Hai Bà Trưng, Hà Nội',
  ownerName: 'PHẠM THU THẢO', ownerId: '0012******47', submittedAt: '23/10/2026', ways: { shop: true, custom: false },
};
