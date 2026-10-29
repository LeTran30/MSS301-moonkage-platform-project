package com.moonkage.identity.platform.id;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UuidV7GeneratorTest {

    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00.123Z");
    private static final int TIMESTAMP_SHIFT = 16;

    @Test
    void isVersion7WithTheRfcVariant() {
        UUID id = new UuidV7Generator(Clock.systemUTC()).next();
        assertEquals(7, id.version());
        assertEquals(2, id.variant());
    }

    @Test
    void startsWithTheClockMilliseconds() {
        UUID id = new UuidV7Generator(Clock.fixed(NOW, ZoneOffset.UTC)).next();
        assertEquals(NOW.toEpochMilli(), id.getMostSignificantBits() >>> TIMESTAMP_SHIFT);
    }

    @Test
    void laterIdsSortAfterEarlierOnes() {
        UUID earlier = new UuidV7Generator(Clock.fixed(NOW, ZoneOffset.UTC)).next();
        UUID later = new UuidV7Generator(Clock.fixed(NOW.plusMillis(1), ZoneOffset.UTC)).next();
        // the database compares uuid columns byte by byte, like this string comparison
        assertTrue(earlier.toString().compareTo(later.toString()) < 0);
    }

    @Test
    void idsOfTheSameMillisecondDiffer() {
        UuidV7Generator generator = new UuidV7Generator(Clock.fixed(NOW, ZoneOffset.UTC));
        assertNotEquals(generator.next(), generator.next());
    }
}
