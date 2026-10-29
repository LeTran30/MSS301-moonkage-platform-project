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
 * FR-01: a new confirmation code, only for an account still waiting for one. Every other email is throttled the same
 * way, so the reply does not reveal which emails have an account.
 */
@Service
@RequiredArgsConstructor
public class ResendVerifyOtp {

    private final AccountApi accountApi;
    private final OtpApi otpApi;
    private final OtpDelivery otpDelivery;

    /** Throws the OTP limits, and EMAIL_DELIVERY_FAILED when the mail cannot be sent. */
    public void handle(Email email) {
        Optional<AccountView> unconfirmed = accountApi.findByEmail(email).filter(account -> !account.verified());
        if (unconfirmed.isEmpty()) {
            otpApi.throttle(OtpPurpose.VERIFY_ACCOUNT, email);
            return;
        }
        otpDelivery.sendConfirmationCode(unconfirmed.get());
    }
}
