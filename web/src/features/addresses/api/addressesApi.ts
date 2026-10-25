import { mockResponse, seedStore } from '../../../shared/api/mock';

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  province: string;
  line: string;
  isDefault: boolean;
}

/** Seed from the wireframe (m6-3); the address endpoints do not exist yet. */
const seed: Address[] = [
  { id: 'a1', label: 'Nhà', name: 'Anh Minh', phone: '0912 345 678', province: 'Hà Nội', line: '18 Hoàng Diệu, Ba Đình', isDefault: true },
  { id: 'a2', label: 'Văn phòng', name: 'Anh Minh', phone: '0912 345 678', province: 'Hà Nội', line: 'Tòa Landmark, Cầu Giấy', isDefault: false },
  { id: 'a3', label: 'Chi nhánh HCM', name: 'Chị Lan', phone: '0988 223 344', province: 'TP Hồ Chí Minh', line: '124 Nguyễn Huệ, Quận 1', isDefault: false },
];

const store = seedStore<Address[]>('addresses', seed);

export const fetchAddresses = () => mockResponse(store.get());
export const fetchAddress = (id: string) => mockResponse(store.get().find((a) => a.id === id) ?? null);

export function saveAddress(input: Omit<Address, 'id'> & { id?: string }): Promise<Address> {
  const id = input.id ?? `a${Date.now()}`;
  const saved = { ...input, id };
  store.update((list) => {
    const next = input.id ? list.map((a) => (a.id === id ? saved : a)) : [...list, saved];
    // one default address at a time
    return saved.isDefault ? next.map((a) => ({ ...a, isDefault: a.id === id })) : next;
  });
  return mockResponse(saved);
}

export function setDefaultAddress(id: string) {
  store.update((list) => list.map((a) => ({ ...a, isDefault: a.id === id })));
  return mockResponse(true);
}

export function deleteAddress(id: string) {
  store.update((list) => list.filter((a) => a.id !== id));
  return mockResponse(true);
}

export const formatAddress = (a: Address) => `${a.line}, ${a.province}`;
