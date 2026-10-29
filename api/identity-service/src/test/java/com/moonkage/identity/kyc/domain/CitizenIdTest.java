package com.moonkage.identity.kyc.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.shared.value.ValueRejected;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class CitizenIdTest {

    @Test
    void cardNumberIsTwelveDigitsShownMasked() {
        CitizenId id = CitizenId.parse("001098012345");

        assertEquals("001098012345", id.value());
        assertEquals("********2345", id.masked().value());
        assertEquals("********2345", id.toString());
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"12345", "00109801234a", " 001098012345", "0010980123456"})
    void cardNumberIsTakenAsIs(String raw) {
        assertEquals(
                ValueRejected.Reason.BAD_FORMAT,
                assertThrows(ValueRejected.class, () -> CitizenId.parse(raw)).reason());
    }

    @Test
    void declaredNumberMayCarrySeparators() {
        assertEquals("079190000006", CitizenId.parseDeclared(" 0791 9000-0006 ").value());
        assertThrows(ValueRejected.class, () -> CitizenId.parseDeclared("0791 9000"));
        assertThrows(ValueRejected.class, () -> CitizenId.parseDeclared(null));
    }
}
