package com.moonkage.identity.platform.id;

import com.moonkage.identity.shared.id.IdGenerator;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * UUID version 7 (RFC 9562): 48 bits of Unix milliseconds, then random bits, so ids sort by creation time and index
 * well. Within one millisecond the order is not guaranteed, which is fine at this scale (plan v2, 5.5.3).
 */
@Component
class UuidV7Generator implements IdGenerator {

    private static final int TIMESTAMP_SHIFT = 16;
    private static final long VERSION_7 = 0x7000L;
    private static final int RANDOM_12_BITS = 0x0FFF;
    private static final long RANDOM_62_BITS = 0x3FFF_FFFF_FFFF_FFFFL;
    private static final long VARIANT_RFC = 0x8000_0000_0000_0000L;

    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    UuidV7Generator(Clock clock) {
        this.clock = clock;
    }

    @Override
    public UUID next() {
        long msb = (clock.millis() << TIMESTAMP_SHIFT) | VERSION_7 | (random.nextInt() & RANDOM_12_BITS);
        long lsb = (random.nextLong() & RANDOM_62_BITS) | VARIANT_RFC;
        return new UUID(msb, lsb);
    }
}
