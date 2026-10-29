package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-01: the code from the confirmation mail confirms the email of the account. */
@Service
@RequiredArgsConstructor
public class VerifyAccount {

    private final OtpApi otpApi;
    private final AccountApi accountApi;

    /** Throws INVALID_OR_EXPIRED or MAX_ATTEMPTS_EXCEEDED; a right code whose account is gone counts as wrong. */
    @Transactional
    public AccountView handle(Command command) {
        otpApi.verify(OtpPurpose.VERIFY_ACCOUNT, command.email(), command.code());
        AccountView account = accountApi
                .findByEmail(command.email())
                .orElseThrow(() -> new AppException(OtpError.INVALID_OR_EXPIRED));
        return accountApi.confirmEmail(account.id());
    }

    public record Command(Email email, OtpCode code) {}
}
