package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.shared.value.ValueRejected;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class RawPasswordTest {

    @Test
    void newPasswordIsKeptAsTyped() {
        assertEquals(" a b c d ", RawPassword.parse(" a b c d ").value());
    }

    @Test
    void newPasswordFitsTheLimitsCountedInCharacters() {
        assertEquals(8, RawPassword.parse("a".repeat(8)).value().length());
        // decision C4: characters, not bytes, so 72 accented letters pass
        assertEquals(72, RawPassword.parse("ệ".repeat(72)).value().length());
    }

    @Test
    void tooShortOrTooLongNamesBothLimits() {
        // validation.password.size = "Mật khẩu từ {min} đến {max} ký tự"
        ValueRejected tooShort = assertThrows(ValueRejected.class, () -> RawPassword.parse("a".repeat(7)));
        assertEquals(ValueRejected.Reason.TOO_SHORT, tooShort.reason());
        assertEquals(Map.of("min", 8, "max", 72), tooShort.args());

        ValueRejected tooLong = assertThrows(ValueRejected.class, () -> RawPassword.parse("a".repeat(73)));
        assertEquals(ValueRejected.Reason.TOO_LONG, tooLong.reason());
        assertEquals(Map.of("min", 8, "max", 72), tooLong.args());
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    void blankIsRequiredForBothDoors(String raw) {
        assertEquals(
                ValueRejected.Reason.REQUIRED,
                assertThrows(ValueRejected.class, () -> RawPassword.parse(raw)).reason());
        assertEquals(
                ValueRejected.Reason.REQUIRED,
                assertThrows(ValueRejected.class, () -> RawPassword.forLogin(raw))
                        .reason());
    }

    @Test
    void loginTakesAPasswordSetBeforeThePolicy() {
        assertEquals("short", RawPassword.forLogin("short").value());
    }

    @Test
    void neverPrints() {
        assertEquals("[PROTECTED]", RawPassword.parse("secret-123").toString());
    }
}
