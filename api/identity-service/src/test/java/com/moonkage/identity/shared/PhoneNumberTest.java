package com.moonkage.identity.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.value.ValueRejected;
import com.moonkage.identity.shared.value.ValueRejected.Reason;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PhoneNumberTest {

    @Test
    void parseTakesTheNationalFormAndKeepsTheSubscriberDigits() {
        // decision C1: people type 0 then 9 digits; the 9 subscriber digits are stored, returned and compared
        PhoneNumber phone = PhoneNumber.parse(" 0912345678 ");
        assertEquals("912345678", phone.value());
        assertEquals("0912345678", phone.toNational());
        assertEquals(new PhoneNumber("912345678"), phone);
    }

    @ParameterizedTest
    @ValueSource(strings = {"+84912345678", "84912345678", "912345678", "0212345678", "091234567", "0912 345 678"})
    void parseRefusesEveryOtherForm(String raw) {
        assertEquals(
                Reason.BAD_FORMAT,
                assertThrows(ValueRejected.class, () -> PhoneNumber.parse(raw)).reason());
        assertFalse(PhoneNumber.isValid(raw));
        assertThrows(AppException.class, () -> PhoneNumber.of(raw));
    }

    @Test
    void parseRequiresAValue() {
        assertEquals(
                Reason.REQUIRED,
                assertThrows(ValueRejected.class, () -> PhoneNumber.parse(" ")).reason());
        assertEquals(
                Reason.REQUIRED,
                assertThrows(ValueRejected.class, () -> PhoneNumber.parse(null)).reason());
    }

    @Test
    void regexOfTheRequestsMatchesParse() {
        assertTrue("0912345678".matches(PhoneNumber.REGEX));
        assertTrue(PhoneNumber.isValid("0312345678"));
        assertFalse("+84912345678".matches(PhoneNumber.REGEX));
    }

    @Test
    void constructorOnlyRefusesABlankValue() {
        assertEquals("0912345678", new PhoneNumber("0912345678").value());
        assertThrows(IllegalArgumentException.class, () -> new PhoneNumber(""));
    }

    @Test
    void toStringIsMasked() {
        PhoneNumber phone = PhoneNumber.parse("0912345678");
        assertEquals("091****678", phone.masked());
        assertEquals(phone.masked(), phone.toString());
    }
}
