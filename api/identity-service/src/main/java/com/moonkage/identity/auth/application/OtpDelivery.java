package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.application.port.OtpMailer;
import com.moonkage.identity.auth.application.port.OtpMailer.OtpMail;
import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Issues a one-time code and mails it. */
@Component
@RequiredArgsConstructor
class OtpDelivery {

    private final OtpApi otpApi;
    private final OtpMailer otpMailer;
    private final ProfileApi profileApi;

    /** Throws when the mail cannot be sent, after dropping the code the user never received. */
    void sendConfirmationCode(Email email, String name) {
        OtpCode code = otpApi.issue(OtpPurpose.VERIFY_ACCOUNT, email);
        try {
            otpMailer.send(OtpMail.ACCOUNT_CONFIRMATION, email, name, code, otpApi.codeLifetime());
        } catch (AppException e) {
            otpApi.discard(OtpPurpose.VERIFY_ACCOUNT, email);
            throw e;
        }
    }

    void sendConfirmationCode(AccountView account) {
        sendConfirmationCode(account.email(), nameOf(account));
    }

    /** Silent when the mail cannot be sent: the reply must not reveal whether the email has an account (FR-02). */
    void sendResetCode(AccountView account) {
        OtpCode code = otpApi.issue(OtpPurpose.RESET_PASSWORD, account.email());
        try {
            otpMailer.send(OtpMail.PASSWORD_RESET, account.email(), nameOf(account), code, otpApi.codeLifetime());
        } catch (AppException e) {
            // already logged by the mailer; the code stays pending, as it always has
        }
    }

    /** Falls back to the email when the profile is missing: the mail still goes out. */
    private String nameOf(AccountView account) {
        return profileApi
                .findFullName(account.id())
                .map(FullName::value)
                .orElse(account.email().value());
    }
}
