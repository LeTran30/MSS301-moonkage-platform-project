package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.shared.Email;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * FR-02, AC-02.1: a password reset code, only for a confirmed account. Every other email is throttled the same way,
 * and a mail that cannot be sent is not reported, so the reply does not reveal which emails have an account.
 */
@Service
@RequiredArgsConstructor
public class SendResetPasswordOtp {

    private final AccountApi accountApi;
    private final OtpApi otpApi;
    private final OtpDelivery otpDelivery;

    /** Throws the OTP limits only. */
    public void handle(Email email) {
        Optional<AccountView> confirmed = accountApi.findByEmail(email).filter(AccountView::verified);
        if (confirmed.isEmpty()) {
            otpApi.throttle(OtpPurpose.RESET_PASSWORD, email);
            return;
        }
        otpDelivery.sendResetCode(confirmed.get());
    }
}
