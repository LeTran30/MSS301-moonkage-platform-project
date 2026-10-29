package com.moonkage.identity.kyc.infrastructure.memory;

import com.moonkage.identity.kyc.application.port.KycAttemptStore;
import com.moonkage.identity.kyc.domain.KycLockout;
import com.moonkage.identity.kyc.domain.KycRules;
import com.moonkage.identity.shared.AccountId;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Attempts and lockouts in this process's memory; a restart forgets them, as it forgets OTP codes. */
@Component
class InMemoryKycAttemptStore implements KycAttemptStore {

    private final Map<AccountId, KycLockout> lockouts = new ConcurrentHashMap<>();

    @Override
    public KycLockout lockoutOf(AccountId id) {
        return lockouts.getOrDefault(id, KycLockout.NONE);
    }

    @Override
    public KycLockout recordFailure(AccountId id, KycRules rules, Instant now) {
        return lockouts.compute(
                id, (key, lockout) -> (lockout == null ? KycLockout.NONE : lockout).recordFailure(rules, now));
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
