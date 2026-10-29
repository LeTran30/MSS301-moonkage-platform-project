package com.moonkage.identity.platform.memory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.platform.config.MovableClock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class ExpiringMapTest {

    private static final Duration TTL = Duration.ofMinutes(5);

    private final MovableClock clock = new MovableClock(Instant.parse("2026-10-29T08:00:00Z"));
    private final ExpiringMap<String, Integer> map = new ExpiringMap<>(clock);

    @Test
    void aValueLivesUntilItsTtlEnds() {
        map.put("a", 1, TTL);

        clock.advance(TTL.minusSeconds(1));
        assertEquals(Optional.of(1), map.get("a"));
        clock.advance(Duration.ofSeconds(1));
        assertTrue(map.get("a").isEmpty());
    }

    @Test
    void computeSeesAnExpiredValueAsMissing() {
        map.put("a", 1, TTL);
        clock.advance(TTL);

        assertEquals(Optional.of(10), map.compute("a", current -> current == null ? 10 : current + 1, TTL));
    }

    @Test
    void computeRestartsTheTtlAndNullRemoves() {
        map.put("a", 1, TTL);
        clock.advance(Duration.ofMinutes(4));
        map.compute("a", current -> current + 1, TTL);
        clock.advance(Duration.ofMinutes(4));
        assertEquals(Optional.of(2), map.get("a"));

        assertTrue(map.compute("a", current -> null, TTL).isEmpty());
        assertTrue(map.get("a").isEmpty());
    }

    @Test
    void purgeDropsOnlyExpiredEntries() {
        map.put("old", 1, Duration.ofMinutes(1));
        map.put("new", 2, TTL);
        clock.advance(Duration.ofMinutes(2));

        map.purgeExpired();

        assertEquals(1, map.size());
        assertEquals(Optional.of(2), map.get("new"));
    }
}
