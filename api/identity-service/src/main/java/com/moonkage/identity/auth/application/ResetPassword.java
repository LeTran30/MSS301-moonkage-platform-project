package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-02: the code from the reset mail sets a new password; every token issued before stops working (Q-04). */
@Service
@RequiredArgsConstructor
public class ResetPassword {

    private final OtpApi otpApi;
    private final AccountApi accountApi;

    /** Throws INVALID_OR_EXPIRED or MAX_ATTEMPTS_EXCEEDED; a right code whose account is gone counts as wrong. */
    @Transactional
    public void handle(Command command) {
        // only a code sent for a reset works here, not a registration code (Q-05)
        otpApi.verify(OtpPurpose.RESET_PASSWORD, command.email(), command.code());
        AccountView account = accountApi
                .findByEmail(command.email())
                .orElseThrow(() -> new AppException(OtpError.INVALID_OR_EXPIRED));
        accountApi.changePassword(account.id(), command.newPassword());
    }

    public record Command(Email email, OtpCode code, RawPassword newPassword) {}
}
