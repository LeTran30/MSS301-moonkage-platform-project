package com.moonkage.identity.otp.infrastructure.memory;

import com.moonkage.identity.otp.application.port.OtpStore;
import com.moonkage.identity.otp.domain.OtpEntry;
import com.moonkage.identity.otp.domain.OtpKey;
import com.moonkage.identity.platform.memory.ExpiringMap;
import java.time.Clock;
import java.time.Duration;
import java.util.function.UnaryOperator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Codes and counters in this process's memory; lost on restart, which only lifts limits early. */
@Component
class InMemoryOtpStore implements OtpStore {

    private final ExpiringMap<OtpKey, OtpEntry> entries;

    InMemoryOtpStore(Clock clock) {
        this.entries = new ExpiringMap<>(clock);
    }

    @Override
    public OtpEntry update(OtpKey key, UnaryOperator<OtpEntry> change, Duration retention) {
        return entries.compute(key, current -> change.apply(current == null ? OtpEntry.EMPTY : current), retention)
                .orElseThrow(() -> new IllegalStateException("an OTP change returned no entry"));
    }

    @Scheduled(fixedDelayString = "${otp.cleanup-interval}")
    void purgeExpired() {
        entries.purgeExpired();
    }
}
