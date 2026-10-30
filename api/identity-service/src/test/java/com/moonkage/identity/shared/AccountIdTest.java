package com.moonkage.identity.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AccountIdTest {

    private static final String V4 = "00000000-0000-4000-8000-000100000000";

    @Test
    void tryParseTakesAnyUuidVersion() {
        // seeded accounts have v4 ids; new ones get v7: no code may assume a version
        assertEquals(Optional.of(new AccountId(UUID.fromString(V4))), AccountId.tryParse(" " + V4 + " "));
        assertEquals(V4, AccountId.tryParse(V4).orElseThrow().toString());
    }

    @Test
    void textThatIsNoUuidIsJustNotFound() {
        assertTrue(AccountId.tryParse("not-a-uuid").isEmpty());
        assertTrue(AccountId.tryParse(null).isEmpty());
    }

    @Test
    void anIdAlwaysHoldsAValue() {
        assertThrows(NullPointerException.class, () -> new AccountId(null));
    }
}
