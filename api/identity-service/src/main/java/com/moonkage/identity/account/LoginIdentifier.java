package com.moonkage.identity.account;

import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;

/** What a person logs in with (FR-02): their email or their phone number. */
public sealed interface LoginIdentifier {

    record ByEmail(Email email) implements LoginIdentifier {}

    record ByPhoneNumber(PhoneNumber phoneNumber) implements LoginIdentifier {}

    /**
     * An email when the text has an '@', otherwise a phone number in the national form (decision C1). Throws
     * ValueRejected: REQUIRED when blank, BAD_FORMAT when it is neither.
     */
    static LoginIdentifier parse(String raw) {
        String text = Text.required(raw);
        try {
            return text.contains("@") ? new ByEmail(Email.parse(text)) : new ByPhoneNumber(PhoneNumber.parse(text));
        } catch (ValueRejected rejected) {
            // one answer for every bad identifier: the message is "enter your email or phone number"
            throw ValueRejected.badFormat();
        }
    }
}
