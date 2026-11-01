package com.moonkage.identity.email;

import com.moonkage.identity.account.atom.Email;
import com.moonkage.identity.common.exception.AppException;

public interface EmailService {

    /**
     * Sends the registration code synchronously, so the caller learns about a failure (FR-01).
     *
     * @param email recipient Email Value Object
     * @param name recipient full name
     * @param otp one-time password
     * @throws AppException when broker/SMTP fails
     */
    void sendVerifyAccountOtp(Email email, String name, String otp);

    /**
     * Sends password reset code. Silent on failure to prevent account probing (FR-02).
     *
     * @param email recipient Email Value Object
     * @param name recipient full name
     * @param otp one-time password
     */
    void sendResetPasswordOtp(Email email, String name, String otp);
}
