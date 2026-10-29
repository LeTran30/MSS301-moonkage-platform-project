package com.moonkage.identity.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.CommonError;
import com.moonkage.identity.shared.value.ValueRejected;
import com.moonkage.identity.shared.value.ValueRejected.Reason;
import org.junit.jupiter.api.Test;

class EmailTest {

    @Test
    void parseTrimsAndLowerCases() {
        assertEquals(new Email("lan.nguyen@example.com"), Email.parse("  Lan.Nguyen@Example.COM  "));
    }

    @Test
    void parseSaysWhyItRefuses() {
        assertEquals(Reason.REQUIRED, reasonOf(null));
        assertEquals(Reason.REQUIRED, reasonOf("   "));
        assertEquals(Reason.BAD_FORMAT, reasonOf("invalid-email"));
        String tooLong = "a".repeat(Email.MAX_LENGTH) + "@x.vn";
        ValueRejected rejected = assertThrows(ValueRejected.class, () -> Email.parse(tooLong));
        assertEquals(Reason.TOO_LONG, rejected.reason());
        assertEquals(Email.MAX_LENGTH, rejected.args().get(ValueRejected.MAX));
    }

    @Test
    void constructorOnlyRefusesABlankValue() {
        // a stored value is trusted: tightening parse later must not break reading old rows
        assertEquals("Not An Email", new Email("Not An Email").value());
        assertThrows(IllegalArgumentException.class, () -> new Email(" "));
        assertThrows(IllegalArgumentException.class, () -> new Email(null));
    }

    @Test
    void ofAnswersABadValueWithCommon400() {
        AppException ex = assertThrows(AppException.class, () -> Email.of("invalid-email"));
        assertEquals(CommonError.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    void toStringNeverShowsTheWholeAddress() {
        Email email = Email.parse("lan.nguyen@example.com");
        assertEquals("l***n@example.com", email.masked());
        assertEquals(email.masked(), email.toString());
    }

    private static Reason reasonOf(String raw) {
        return assertThrows(ValueRejected.class, () -> Email.parse(raw)).reason();
    }
}
