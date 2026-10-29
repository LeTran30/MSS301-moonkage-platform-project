package com.moonkage.identity.auth.application.port;

import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.shared.Email;
import java.time.Duration;

/** Mails a one-time code. Hands the mail over before returning, so a failure is known at once. */
public interface OtpMailer {

    /**
     * Sends one code to one recipient.
     *
     * @param name how the mail greets the recipient
     * @param validFor how long the code works, told to the recipient
     * @throws com.moonkage.identity.shared.error.AppException {@code EMAIL_DELIVERY_FAILED} when the mail cannot be
     *     handed over
     */
    void send(OtpMail mail, Email to, String name, OtpCode code, Duration validFor);

    /** Which mail: each has its own template and subject. */
    enum OtpMail {
        ACCOUNT_CONFIRMATION,
        PASSWORD_RESET
    }
}
