package com.moonkage.identity.platform.memory;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.UnaryOperator;

/**
 * A map whose entries expire, for the in-memory stores (OTP codes, counters, NFC sessions; plan v2, 6.3). Each change
 * of one key is atomic, an expired entry reads as missing, and time comes from the {@link Clock}. Expired entries
 * are only dropped by {@link #purgeExpired()}, which the owning store schedules.
 *
 * <p>One process only: running more instances needs a shared store (Redis) behind the same ports.
 */
public final class ExpiringMap<K, V> {

    private record Entry<V>(V value, Instant expiresAt) {
        boolean isLiveAt(Instant now) {
            return expiresAt.isAfter(now);
        }
    }

    private final ConcurrentHashMap<K, Entry<V>> entries = new ConcurrentHashMap<>();
    private final Clock clock;

    public ExpiringMap(Clock clock) {
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    /** The live value, or empty when missing or expired. */
    public Optional<V> get(K key) {
        Instant now = clock.instant();
        Entry<V> entry = entries.get(key);
        return entry != null && entry.isLiveAt(now) ? Optional.of(entry.value()) : Optional.empty();
    }

    /**
     * Atomically replaces the value of {@code key}. {@code change} receives the live value or null, and returns the
     * new value or null to remove the key. A kept value lives {@code ttl} from now.
     *
     * @return the new value, or empty when removed
     */
    public Optional<V> compute(K key, UnaryOperator<V> change, Duration ttl) {
        Objects.requireNonNull(ttl, "ttl");
        Instant now = clock.instant();
        Entry<V> result = entries.compute(key, (k, current) -> {
            V live = current != null && current.isLiveAt(now) ? current.value() : null;
            V next = change.apply(live);
            return next == null ? null : new Entry<>(next, now.plus(ttl));
        });
        return result == null ? Optional.empty() : Optional.of(result.value());
    }

    /** Stores {@code value} for {@code ttl} from now, replacing any previous one. */
    public void put(K key, V value, Duration ttl) {
        Objects.requireNonNull(value, "value");
        compute(key, current -> value, ttl);
    }

    public void remove(K key) {
        entries.remove(key);
    }

    /** Drops every expired entry; reads already ignore them, this only frees memory. */
    public void purgeExpired() {
        Instant now = clock.instant();
        entries.entrySet().removeIf(e -> !e.getValue().isLiveAt(now));
    }

    /** Entries held, expired ones included until the next purge. */
    public int size() {
        return entries.size();
    }
}
