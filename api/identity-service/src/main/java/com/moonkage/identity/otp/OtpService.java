package com.moonkage.identity.otp;

import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;

/** Codes, counters and lockouts are kept per (purpose, email): a code never works for another purpose. */
public interface OtpService {

    /**
     * Issues an OTP for the given email, enforcing rate limiting, resend cooldown,
     * hourly quotas, and reusing active OTPs without resetting failed attempt counters.
     *
     * @param purpose what the code is for
     * @param email user email Value Object
     * @return the OTP code to send
     * @throws AppException if rate limits or lockout conditions are violated
     */
    String issueOtp(OtpPurpose purpose, Email email);

    /**
     * Applies the same cooldown, quota and lockout as {@link #issueOtp} without creating a code. Call it when
     * no OTP will be sent (unknown email), so the reply cannot reveal whether an account exists (FR-02).
     *
     * @param purpose what the code would have been for
     * @param email user email Value Object
     * @throws AppException if rate limits or lockout conditions are violated
     */
    void throttleSend(OtpPurpose purpose, Email email);

    /**
     * Verifies the provided OTP and consumes it on success. Any failure, including an email with no pending
     * code, increments the failure counter and locks out the email once the maximum is reached.
     *
     * @param purpose what the code must have been issued for
     * @param email user email Value Object
     * @param otp OTP entered by the user
     * @throws AppException OTP_INVALID_OR_EXPIRED for a wrong, expired or missing
     *     code; OTP_MAX_ATTEMPTS_EXCEEDED once locked out
     */
    void verifyOtp(OtpPurpose purpose, Email email, String otp);

    /**
     * Drops the pending code (e.g. it could not be delivered). Rate limit counters are kept.
     *
     * @param purpose what the code was for
     * @param email user email Value Object
     */
    void clearOtp(OtpPurpose purpose, Email email);
}
