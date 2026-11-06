/**
 * The saved delivery addresses of the caller (FR-03, M6.3).
 *
 * One address belongs to the account, not to an order: the checkout copies it
 * into the order it creates, so a later edit of the address never rewrites a
 * placed order (BR-19).
 */
export type Address = {
  id: string;
  recipientName: string;
  recipientPhone: string;
  /** 2-digit national code, e.g. `01` for Hà Nội. */
  provinceCode: string;
  provinceName: string;
  wardName: string;
  detail: string;
  /** `detail, ward, province` on one line, ready to show. */
  fullAddress: string;
  /** Key to filter products and sellers by delivery area (AC-03.2). */
  areaCode?: string;
  label?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** The payload of creating or replacing an address (`AddAddressRequest`). */
export type AddressPayload = {
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardName: string;
  detail: string;
  label?: string;
  /** true = make this the default; omitted on update keeps the current flag. */
  isDefault?: boolean;
};
