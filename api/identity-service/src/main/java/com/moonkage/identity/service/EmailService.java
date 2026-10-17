package com.moonkage.identity.service;

public interface EmailService {

    /**
     * Sends the registration code synchronously, so the caller learns about a failure (FR-01).
     *
     * @throws com.moonkage.identity.exception.EmailDeliveryException when SMTP fails
     */
    void sendOtpForVerifyAccount(String email, String name, String otp);

    void sendOtpForForgotPassword(String email, String name, String otp);

    String generateOTP();

    void storageOtp(String email, String otp);

    boolean verifyOtp(String email, String otpVerify);

    void clearOtp(String email);
}
