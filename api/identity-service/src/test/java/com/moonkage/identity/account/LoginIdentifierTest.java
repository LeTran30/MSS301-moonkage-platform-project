package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.value.ValueRejected;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LoginIdentifierTest {

    @Test
    void textWithAnAtIsAnEmail() {
        assertEquals(new LoginIdentifier.ByEmail(Email.parse("lan@x.vn")), LoginIdentifier.parse(" Lan@X.vn "));
    }

    @Test
    void otherTextIsANationalPhoneNumber() {
        assertEquals(
                new LoginIdentifier.ByPhoneNumber(PhoneNumber.parse("0912345678")),
                LoginIdentifier.parse("0912345678"));
    }

    @ParameterizedTest
    // decision C1: only the national form is a phone login
    @ValueSource(strings = {"+84912345678", "912345678", "not-a-login", "lan@", "@x.vn"})
    void neitherIsBadFormat(String raw) {
        assertEquals(
                ValueRejected.Reason.BAD_FORMAT,
                assertThrows(ValueRejected.class, () -> LoginIdentifier.parse(raw))
                        .reason());
    }

    @Test
    void blankIsRequired() {
        assertEquals(
                ValueRejected.Reason.REQUIRED,
                assertThrows(ValueRejected.class, () -> LoginIdentifier.parse(" "))
                        .reason());
    }
}
