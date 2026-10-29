package com.moonkage.identity.otp.application;

import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.application.port.OtpStore;
import com.moonkage.identity.otp.domain.OtpEntry;
import com.moonkage.identity.otp.domain.OtpKey;
import com.moonkage.identity.otp.domain.OtpRules;
import com.moonkage.identity.shared.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Drops a code that never reached the person; the counters stay, so a failed send cannot lift a lockout or quota. */
@Service
@RequiredArgsConstructor
class DiscardOtp {

    private final OtpStore store;
    private final OtpRules rules;

    void handle(OtpPurpose purpose, Email email) {
        store.update(new OtpKey(purpose, email), OtpEntry::withoutCode, rules.retention());
    }
}
