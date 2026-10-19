package com.moonkage.identity.service;

public interface EmailService {

    /**
     * Sends the registration code synchronously, so the caller learns about a failure (FR-01).
     *
     * @throws com.moonkage.identity.exception.AppException when broker/SMTP fails
     */
    void sendVerifyAccountOtp(String email, String name, String otp);

    /**
     * Sends password reset code. Silent on failure to prevent account probing (FR-02).
     */
    void sendResetPasswordOtp(String email, String name, String otp);
}
