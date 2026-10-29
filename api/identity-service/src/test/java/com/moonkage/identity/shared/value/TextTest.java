package com.moonkage.identity.shared.value;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.shared.value.ValueRejected.Reason;
import org.junit.jupiter.api.Test;

class TextTest {

    @Test
    void requiredTrimsAndRefusesBlank() {
        assertEquals("Lan", Text.required("  Lan "));
        assertEquals(
                Reason.REQUIRED,
                assertThrows(ValueRejected.class, () -> Text.required(null)).reason());
        assertEquals(
                Reason.REQUIRED,
                assertThrows(ValueRejected.class, () -> Text.required(" \t")).reason());
    }

    @Test
    void boundedCountsTheTrimmedText() {
        assertEquals("abc", Text.bounded("  abc  ", 3));
        ValueRejected rejected = assertThrows(ValueRejected.class, () -> Text.bounded("abcd", 3));
        assertEquals(Reason.TOO_LONG, rejected.reason());
        assertEquals(3, rejected.args().get(ValueRejected.MAX));
    }

    @Test
    void assertPresentIsForBugsNotInput() {
        assertEquals("x", Text.assertPresent("x", "name"));
        assertThrows(IllegalArgumentException.class, () -> Text.assertPresent(" ", "name"));
    }

    @Test
    void rejectionCarriesNoStackTrace() {
        // bad input is no bug: building a stack trace for every refused field would be waste
        assertEquals(0, ValueRejected.badFormat().getStackTrace().length);
        assertEquals(5, ValueRejected.tooShort(5).args().get(ValueRejected.MIN));
    }
}
