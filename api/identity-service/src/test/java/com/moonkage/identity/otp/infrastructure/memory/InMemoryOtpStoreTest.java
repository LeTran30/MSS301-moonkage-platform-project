package com.moonkage.identity.otp.infrastructure.memory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.domain.OtpEntry;
import com.moonkage.identity.otp.domain.OtpKey;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.shared.Email;
import java.time.Duration;
import java.time.Instant;
import java.util.function.UnaryOperator;
import org.junit.jupiter.api.Test;

class InMemoryOtpStoreTest {

    private static final OtpKey KEY = new OtpKey(OtpPurpose.VERIFY_ACCOUNT, Email.parse("a@x.vn"));
    private static final Duration RETENTION = Duration.ofHours(1);
    private static final OtpEntry WITH_CODE =
            new OtpEntry(new OtpCode("123456"), Instant.parse("2026-10-29T08:05:00Z"), 0, null, 0, null, null);

    private final MovableClock clock = new MovableClock(Instant.parse("2026-10-29T08:00:00Z"));
    private final InMemoryOtpStore store = new InMemoryOtpStore(clock);

    @Test
    void firstChangeStartsFromAnEmptyEntry() {
        store.update(
                KEY,
                current -> {
                    assertEquals(OtpEntry.EMPTY, current);
                    return WITH_CODE;
                },
                RETENTION);

        assertEquals(WITH_CODE, store.update(KEY, UnaryOperator.identity(), RETENTION));
    }

    @Test
    void entryIsForgottenOnceItsRetentionIsOver() {
        store.update(KEY, current -> WITH_CODE, RETENTION);

        clock.advance(RETENTION);
        store.purgeExpired();

        assertEquals(OtpEntry.EMPTY, store.update(KEY, UnaryOperator.identity(), RETENTION));
    }

    @Test
    void refusedChangeLeavesTheEntryAsItWas() {
        store.update(KEY, current -> WITH_CODE, RETENTION);

        assertThrows(
                IllegalStateException.class,
                () -> store.update(
                        KEY,
                        current -> {
                            throw new IllegalStateException("refused");
                        },
                        RETENTION));

        assertEquals(WITH_CODE, store.update(KEY, UnaryOperator.identity(), RETENTION));
    }
}
