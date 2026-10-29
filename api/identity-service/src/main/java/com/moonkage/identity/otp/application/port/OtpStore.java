package com.moonkage.identity.otp.application.port;

import com.moonkage.identity.otp.domain.OtpEntry;
import com.moonkage.identity.otp.domain.OtpKey;
import java.time.Duration;
import java.util.function.UnaryOperator;

/** Where codes and counters live. One change at a time per key: never a read, then a separate write. */
public interface OtpStore {

    /**
     * Atomically replaces the entry of {@code key}. {@code change} receives the current entry ({@link OtpEntry#EMPTY}
     * when there is none) and returns the new one; when it throws, nothing changes. The new entry is kept for
     * {@code retention} from now.
     *
     * @return the new entry
     */
    OtpEntry update(OtpKey key, UnaryOperator<OtpEntry> change, Duration retention);
}
