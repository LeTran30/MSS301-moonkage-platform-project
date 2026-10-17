package com.moonkage.identity.service;

public interface EmailService {

    void sendOtpForVerifyAccount(String email, String name, String otp);

    void sendOtpForForgotPassword(String email, String name, String otp);

    String generateOTP();

    void storageOtp(String email, String otp);

    boolean verifyOtp(String email, String otpVerify);

    void clearOtp(String email);
}
