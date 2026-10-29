package com.moonkage.identity.otp.domain;

import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.shared.Email;
import java.util.Objects;

/** One code and one set of counters per purpose and email (Q-05). */
public record OtpKey(OtpPurpose purpose, Email email) {

    public OtpKey {
        Objects.requireNonNull(purpose, "purpose");
        Objects.requireNonNull(email, "email");
    }
}
