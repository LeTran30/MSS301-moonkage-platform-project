package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.value.ValueRejected;
import java.util.Map;

/**
 * Fields several auth requests share, with the message keys clients already see. A password refused for its length
 * gets one message naming both limits, whichever limit it broke.
 */
final class AuthFields {

    static final String EMAIL = "email";
    static final String OTP = "otp";

    private static final Map<ValueRejected.Reason, String> EMAIL_KEYS =
            Map.of(ValueRejected.Reason.TOO_LONG, "validation.email.invalid");
    private static final String PASSWORD_SIZE_KEY = "validation.password.size";
    private static final Map<ValueRejected.Reason, String> PASSWORD_KEYS = Map.of(
            ValueRejected.Reason.TOO_SHORT, PASSWORD_SIZE_KEY,
            ValueRejected.Reason.TOO_LONG, PASSWORD_SIZE_KEY);

    private AuthFields() {}

    static Email email(FieldParser parser, String raw) {
        return parser.required(EMAIL, "validation.email", EMAIL_KEYS, raw, Email::parse);
    }

    static OtpCode otpCode(FieldParser parser, String raw) {
        return parser.required(OTP, "validation.otp", raw, OtpCode::parse);
    }

    /** A password being set: the full policy of {@link RawPassword#parse}. */
    static RawPassword newPassword(FieldParser parser, String field, String keyPrefix, String raw) {
        return parser.required(field, keyPrefix, PASSWORD_KEYS, raw, RawPassword::parse);
    }
}
