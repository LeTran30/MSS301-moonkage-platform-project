package com.moonkage.identity.otp.application;

import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.domain.OtpRules;
import com.moonkage.identity.shared.Email;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The module's one door for other modules: each call goes to its use case. */
@Service
@RequiredArgsConstructor
class OtpFacade implements OtpApi {

    private final IssueOtp issueOtp;
    private final ThrottleOtpSend throttleOtpSend;
    private final VerifyOtp verifyOtp;
    private final DiscardOtp discardOtp;
    private final OtpRules rules;

    @Override
    public OtpCode issue(OtpPurpose purpose, Email email) {
        return issueOtp.handle(purpose, email);
    }

    @Override
    public void throttle(OtpPurpose purpose, Email email) {
        throttleOtpSend.handle(purpose, email);
    }

    @Override
    public void verify(OtpPurpose purpose, Email email, OtpCode code) {
        verifyOtp.handle(purpose, email, code);
    }

    @Override
    public void discard(OtpPurpose purpose, Email email) {
        discardOtp.handle(purpose, email);
    }

    @Override
    public Duration codeLifetime() {
        return rules.codeLifetime();
    }
}
