package com.moonkage.identity.common;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class DomainGuardTest {

    private static final int MAX_LENGTH = 5;
    private static final String FIELD = "label";

    @Test
    void requiredTextIsTrimmedAndBounded() {
        assertEquals("abc", DomainGuard.requireText("  abc ", MAX_LENGTH, FIELD));
        assertEquals("abcde", DomainGuard.requireText("abcde", MAX_LENGTH, FIELD));

        assertInvalid(() -> DomainGuard.requireText(null, MAX_LENGTH, FIELD));
        assertInvalid(() -> DomainGuard.requireText("   ", MAX_LENGTH, FIELD));
        assertInvalid(() -> DomainGuard.requireText("abcdef", MAX_LENGTH, FIELD));
    }

    @Test
    void optionalTextTurnsBlankIntoNull() {
        assertNull(DomainGuard.optionalText(null, MAX_LENGTH, FIELD));
        assertNull(DomainGuard.optionalText("  ", MAX_LENGTH, FIELD));
        assertEquals("abc", DomainGuard.optionalText(" abc ", MAX_LENGTH, FIELD));

        assertInvalid(() -> DomainGuard.optionalText("abcdef", MAX_LENGTH, FIELD));
    }

    @Test
    void patternMustMatchTheWholeValue() {
        Pattern digits = Pattern.compile("\\d{2}");
        assertEquals("79", DomainGuard.requireMatches("79", digits, FIELD));

        assertInvalid(() -> DomainGuard.requireMatches("791", digits, FIELD));
        assertInvalid(() -> DomainGuard.requireMatches(" 79", digits, FIELD));
        assertInvalid(() -> DomainGuard.requireMatches(null, digits, FIELD));
    }

    @Test
    void lowerBoundIsInclusive() {
        assertEquals(1, DomainGuard.requireAtLeast(1, 1, FIELD));

        assertInvalid(() -> DomainGuard.requireAtLeast(0, 1, FIELD));
    }

    @Test
    void brokenRuleNamesTheField() {
        AppException ex = assertThrows(AppException.class, () -> DomainGuard.requireNonNull(null, FIELD));

        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        assertArrayEquals(new Object[] {FIELD}, ex.getArgs());
    }

    private static void assertInvalid(Runnable check) {
        AppException ex = assertThrows(AppException.class, check::run);
        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }
}
