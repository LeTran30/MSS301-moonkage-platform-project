export type UserRole = 'GUEST' | 'BUYER' | 'VENDOR' | 'ADMIN';

export type NfcVerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'LOCKED';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  nfcStatus: NfcVerificationStatus;
  idCardNumberMasked?: string;
  vendorId?: string;
  vendorName?: string;
  hasShop?: boolean;
  acceptsCustomOrders?: boolean;
};

export const DEMO_ACTORS: Record<string, User> = {
  minh: {
    id: 'usr_minh',
    name: 'Anh Minh',
    email: 'minh.retail@gmail.com',
    phone: '0903123456',
    role: 'BUYER',
    nfcStatus: 'UNVERIFIED',
    idCardNumberMasked: '0792••••4567',
  },
  lan: {
    id: 'usr_lan',
    name: 'Chị Lan (HR Doanh nghiệp)',
    email: 'lan.hr@globalcorp.vn',
    phone: '0918889999',
    role: 'BUYER',
    nfcStatus: 'VERIFIED',
    idCardNumberMasked: '0011••••9876',
  },
  thao: {
    id: 'usr_thao',
    name: 'Chị Thảo (Tiệm Quà & Sỉ)',
    email: 'thao.gifts@gmail.com',
    phone: '0987654321',
    role: 'VENDOR',
    nfcStatus: 'VERIFIED',
    idCardNumberMasked: '0791••••1122',
    vendorId: 'ven_thao',
    vendorName: 'Tiệm Bánh & Quà Thu Nguyệt',
    hasShop: true,
    acceptsCustomOrders: false,
  },
  hoa: {
    id: 'usr_hoa',
    name: 'Cô Hoa (Xưởng thủ công)',
    email: 'cohoa.banhtrang@gmail.com',
    phone: '0908777666',
    role: 'VENDOR',
    nfcStatus: 'VERIFIED',
    idCardNumberMasked: '0800••••3344',
    vendorId: 'ven_hoa',
    vendorName: 'Xưởng Bánh Truyền Thống Cô Hoa',
    hasShop: false,
    acceptsCustomOrders: true,
  },
  quan: {
    id: 'usr_quan',
    name: 'Anh Quân (Tiệm bánh có Shop)',
    email: 'quan.bakery@hanoi.vn',
    phone: '0933445566',
    role: 'VENDOR',
    nfcStatus: 'VERIFIED',
    idCardNumberMasked: '0010••••5566',
    vendorId: 'ven_quan',
    vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
    hasShop: true,
    acceptsCustomOrders: true,
  },
  admin: {
    id: 'usr_admin',
    name: 'Quản trị viên Moonkage',
    email: 'operator@moonkage.vn',
    phone: '0901000999',
    role: 'ADMIN',
    nfcStatus: 'VERIFIED',
  },
};
