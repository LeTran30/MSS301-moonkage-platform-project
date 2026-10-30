package com.moonkage.identity.nfc.infrastructure.memory;

import com.moonkage.identity.nfc.application.port.NfcAttemptStore;
import com.moonkage.identity.nfc.domain.NfcLockout;
import com.moonkage.identity.nfc.domain.NfcRules;
import com.moonkage.identity.shared.AccountId;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Attempts and lockouts in this process's memory; a restart forgets them, as it forgets OTP codes. */
@Component
class InMemoryNfcAttemptStore implements NfcAttemptStore {

    private final Map<AccountId, NfcLockout> lockouts = new ConcurrentHashMap<>();

    @Override
    public NfcLockout lockoutOf(AccountId id) {
        return lockouts.getOrDefault(id, NfcLockout.NONE);
    }

    @Override
    public NfcLockout recordFailure(AccountId id, NfcRules rules, Instant now) {
        return lockouts.compute(
                id, (key, lockout) -> (lockout == null ? NfcLockout.NONE : lockout).recordFailure(rules, now));
    }

    @Override
    public void clear(AccountId id) {
        lockouts.remove(id);
    }

    @Override
    public void removeFinished(Instant now) {
        lockouts.values().removeIf(lockout -> lockout.isFinished(now));
    }
}
