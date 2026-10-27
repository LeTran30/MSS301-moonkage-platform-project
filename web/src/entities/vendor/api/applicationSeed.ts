import type { VendorApplication } from '../model/applicationTypes';

/** Admin seed from the wireframe (q1-0 … q6-4). */
export const seedApplications: VendorApplication[] = [
  {
    id: 'thao-moc', account: 'chohoso@moonkage.vn', shopName: 'Tiệm Bánh Thảo Mộc', kind: 'Hộ kinh doanh', city: 'Hà Nội', ways: 'Shop',
    attempt: 1, submittedAt: '23/10/2026', waiting: 'chờ 1 ngày', regNo: '01K9002231', address: '8 Ngõ Huế, Hai Bà Trưng, Hà Nội', source: 'Tự sản xuất',
    ownerOnPaper: { name: 'Phạm Thu Thảo', id: '001290004712' }, ownerOnChip: { name: 'PHẠM THU THẢO', id: '001290004712' }, state: 'pending',
    history: [
      { label: 'Hệ thống so khớp chủ hộ: khớp', at: '23/10/2026 15:00' },
      { label: 'Người bán nộp hồ sơ lần 1', at: '23/10/2026 14:30' },
    ],
  },
  {
    id: 'nghe-nhan', account: 'chushop@moonkage.vn', shopName: 'Xưởng Bánh Nghệ Nhân', kind: 'Hộ kinh doanh', city: 'Hà Nội', ways: 'Shop + nhận đặt hàng',
    attempt: 1, submittedAt: '22/10/2026', waiting: 'duyệt 24/10/2026', regNo: '01J8001928', address: '12 Phan Kế Bính, Ba Đình, Hà Nội', source: 'Tự sản xuất',
    ownerOnPaper: { name: 'Vũ Thị Mai Hoa', id: '001188009922' }, ownerOnChip: { name: 'VŨ THỊ MAI HOA', id: '001188009922' }, state: 'approved',
    history: [
      { label: 'Quản trị duyệt hồ sơ', at: '24/10/2026 09:10' },
      { label: 'Người bán nộp hồ sơ lần 1', at: '22/10/2026 10:05' },
    ],
  },
  {
    id: 'minh-tam', account: '', shopName: 'Xưởng bánh Minh Tâm', kind: 'Doanh nghiệp tư nhân', city: 'TP Hồ Chí Minh', ways: 'Nhận đặt hàng',
    attempt: 2, submittedAt: '21/10/2026', waiting: 'gửi lại 21/10/2026', regNo: '0316002871', address: '45 Lý Thường Kiệt, Quận 10, TP Hồ Chí Minh', source: 'Tự sản xuất',
    ownerOnPaper: { name: 'Lê Minh Tâm', id: '079085001234' }, ownerOnChip: { name: 'LÊ MINH TÂM', id: '079085001243' }, state: 'needs-more',
    history: [
      { label: 'Quản trị yêu cầu bổ sung: số định danh trên giấy khác chip', at: '20/10/2026' },
      { label: 'Người bán nộp hồ sơ lần 1', at: '18/10/2026' },
    ],
  },
];

