export interface LoginResponse {
  token: string;
  refreshToken: string;
  accountId: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role: string;
}

export interface AccountInfo {
  accountId: string;
  email: string;
  phoneNumber?: string;
  fullName?: string;
  role: string;
}
