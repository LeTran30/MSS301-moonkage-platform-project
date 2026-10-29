package com.moonkage.identity.shared.id;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/** Ids 00000000-0000-7000-8000-000000000001, …002, …: tests can name the id a use case will give (plan v2, 5.5.3). */
public final class SequentialIdGenerator implements IdGenerator {

    private static final long VERSION_7 = 0x7000L;
    private static final long VARIANT_RFC = 0x8000_0000_0000_0000L;

    private final AtomicLong counter = new AtomicLong();

    @Override
    public UUID next() {
        return nth(counter.incrementAndGet());
    }

    /** The id {@link #next()} returns the {@code n}-th time. */
    public static UUID nth(long n) {
        return new UUID(VERSION_7, VARIANT_RFC | n);
    }
}
