/**
 * Wire shapes of the identity service.
 *
 * They live apart from `sessionApi` so the read side of the session and the
 * write side (in the `login`, `register`, `verify-account` and `reset-password`
 * features) can share the same contracts without a circular import.
 */

/** Wire shape of `com.moonkage.identity.auth.dto.LoginResponse`. */
export interface LoginDto {
  token: string;
  refreshToken: string;
  accountId: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  role: string;
}

/**
 * Wire shape of `com.moonkage.identity.auth.dto.RegisterAccountResponse`.
 *
 * `verified` says the e-mail is confirmed; `otpSent` says the OTP was sent.
 */
export interface RegisterDto {
  id: string;
  email: string;
  phoneNumber: string;
  verified: boolean;
  otpSent: boolean;
}

/**
 * Wire shape of `com.moonkage.identity.auth.dto.VerifyAccountResponse`.
 */
export interface VerifyAccountDto {
  id: string;
  email: string;
  phoneNumber: string;
  verified: boolean;
}
